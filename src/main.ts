// src/main.ts
import { createForm, getFormValues, isFormValid, resetForm, setFormValues } from './ui'
import { calculateToolpath } from './toolpath'
import { generateGCode } from './gcode'
import { generatePreviewSVG } from './preview'
import { mergeWithDefaults } from './defaults'
import type { SurfacingParams } from './types'
import { type ColorName, PALETTES, applyTheme, saveTheme, loadTheme, getCurrentTheme } from './theme'
import { loadToolSettings, saveToolSettings, extractToolSettings, exportToURL, importFromURL } from './settings'

function showToast(message: string, type: 'success' | 'error' = 'success') {
  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  // Trigger animation
  setTimeout(() => toast.classList.add('show'), 10)

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

function init() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  // Add dev mode indicator
  if (import.meta.env.DEV) {
    document.body.classList.add('is-dev')
  }

  // Load saved theme (must happen after is-dev class is added)
  loadTheme()

  app.innerHTML = `
    <div class="app-content">
      <div class="header">
        <h1 class="title">RasterMaster</h1>
        <div class="menu-container">
          <button class="menu-trigger" id="menuTrigger" aria-label="Menu">
          <svg class="gear-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/>
          </svg>
        </button>
          <div class="menu-dropdown" id="menuDropdown">
            <button class="menu-item" id="newMenuItem">
              <span>⟳</span>
              <span>New</span>
            </button>
            <button class="menu-item" id="copyToolUrlMenuItem">
              <span>🔗</span>
              <span>Copy Tool URL</span>
            </button>
            <button class="menu-item" id="importToolUrlMenuItem">
              <span>📋</span>
              <span>Import Tool URL</span>
            </button>
            <button class="menu-item" id="settingsMenuItem">
              <span>⚙</span>
              <span>Settings</span>
            </button>
          </div>
        </div>
      </div>
      <div class="container">
        <div id="form-container"></div>
        <div class="preview-container">
          <div id="preview"></div>
          <button class="generate-btn" id="generateBtn" disabled>Generate GCode</button>
        </div>
      </div>
    </div>
    
    <!-- Settings Modal -->
    <div class="settings-modal" id="settingsModal">
      <div class="settings-panel">
        <div class="settings-header">
          <h2>Settings</h2>
          <button class="settings-close" id="settingsClose">×</button>
        </div>
        <div class="settings-content">
          <div class="settings-section">
            <h3>Color Palette</h3>
            <div class="palette-grid" id="paletteGrid">
              ${Object.entries(PALETTES).map(([colorName, palette]) => `
                <button 
                  class="palette-swatch" 
                  data-color="${colorName}"
                  style="--swatch-color: ${palette.hex}"
                  title="${colorName.charAt(0).toUpperCase() + colorName.slice(1)}"
                  aria-label="Select ${colorName} theme"
                ></button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `

  const formContainer = app.querySelector('#form-container')!
  const previewContainer = app.querySelector('#preview')!
  const generateBtn = app.querySelector('#generateBtn') as HTMLButtonElement
  const menuTrigger = app.querySelector('#menuTrigger') as HTMLButtonElement
  const menuDropdown = app.querySelector('#menuDropdown') as HTMLDivElement
  const newMenuItem = app.querySelector('#newMenuItem') as HTMLButtonElement
  const copyToolUrlMenuItem = app.querySelector('#copyToolUrlMenuItem') as HTMLButtonElement
  const importToolUrlMenuItem = app.querySelector('#importToolUrlMenuItem') as HTMLButtonElement
  const settingsMenuItem = app.querySelector('#settingsMenuItem') as HTMLButtonElement
  const settingsModal = app.querySelector('#settingsModal') as HTMLDivElement
  const settingsClose = app.querySelector('#settingsClose') as HTMLButtonElement
  const paletteSwatches = app.querySelectorAll('.palette-swatch') as NodeListOf<HTMLButtonElement>

  let currentParams: Partial<SurfacingParams> = {}

  // Update active swatch based on current theme
  function updateActiveSwatch() {
    const currentTheme = getCurrentTheme()
    paletteSwatches.forEach(swatch => {
      const colorName = swatch.getAttribute('data-color')
      if (colorName === currentTheme) {
        swatch.classList.add('active')
      } else {
        swatch.classList.remove('active')
      }
    })
  }

  function updatePreview() {
    if (!isFormValid(currentParams)) {
      previewContainer.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Enter stock dimensions to see preview</p>'
      generateBtn.disabled = true
      return
    }

    const params = mergeWithDefaults(currentParams as { stockWidth: number; stockHeight: number } & Partial<SurfacingParams>)
    const toolpath = calculateToolpath(params)
    const rect = previewContainer.getBoundingClientRect()
    const svg = generatePreviewSVG(toolpath, rect.width || 500, rect.height || 375)
    previewContainer.innerHTML = svg
    generateBtn.disabled = false
  }

  // Debounced auto-save for tool settings
  let saveTimeout: number | undefined
  function debouncedSave(params: Partial<SurfacingParams>) {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      const toolSettings = extractToolSettings(params)
      // Only save if at least one tool field is present
      if (Object.values(toolSettings).some(v => v !== undefined)) {
        saveToolSettings(toolSettings as any) // Will save partial settings
      }
    }, 500) // 500ms debounce
  }

  const form = createForm((params) => {
    currentParams = params
    updatePreview()
    debouncedSave(params)
  })
  formContainer.appendChild(form)

  // Auto-import from URL hash if present (takes precedence over saved settings)
  if (window.location.hash.startsWith('#tool=')) {
    try {
      const imported = importFromURL(window.location.hash)
      saveToolSettings(imported)
      setFormValues(form, imported)
      currentParams = getFormValues(form)
      updatePreview()
      // Clear hash after import to avoid re-importing on reload
      window.history.replaceState(null, '', window.location.pathname)
      console.log('Tool settings imported from URL')
    } catch (e) {
      console.error('Failed to import from URL hash:', e)
    }
  } else {
    // Load saved tool settings and apply to form
    const savedSettings = loadToolSettings()
    if (savedSettings) {
      setFormValues(form, savedSettings)
      // Trigger update to apply loaded values
      currentParams = getFormValues(form)
      updatePreview()
    }
  }

  // Menu toggle
  menuTrigger.addEventListener('click', (e) => {
    e.stopPropagation()
    menuDropdown.classList.toggle('open')
    menuTrigger.classList.toggle('active')
  })

  // Close menu on click outside
  document.addEventListener('click', () => {
    menuDropdown.classList.remove('open')
    menuTrigger.classList.remove('active')
  })

  // Prevent menu from closing when clicking inside it
  menuDropdown.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  // New project action
  newMenuItem.addEventListener('click', () => {
    resetForm(form, (params) => {
      currentParams = params
      updatePreview()
    })
    // Restore saved tool settings after reset
    const savedSettings = loadToolSettings()
    if (savedSettings) {
      setFormValues(form, savedSettings)
      currentParams = getFormValues(form)
      updatePreview()
    }
    menuDropdown.classList.remove('open')
    menuTrigger.classList.remove('active')
  })

  // Copy Tool URL action
  copyToolUrlMenuItem.addEventListener('click', async () => {
    const toolSettings = extractToolSettings(currentParams)
    // Only export if at least one tool field is present
    if (Object.values(toolSettings).some(v => v !== undefined)) {
      const url = window.location.origin + window.location.pathname + exportToURL(toolSettings as any)
      try {
        await navigator.clipboard.writeText(url)
        showToast('Tool URL copied to clipboard')
      } catch (e) {
        console.error('Failed to copy URL:', e)
        showToast('Failed to copy URL', 'error')
      }
    }
    menuDropdown.classList.remove('open')
    menuTrigger.classList.remove('active')
  })

  // Import Tool URL action
  importToolUrlMenuItem.addEventListener('click', () => {
    const url = prompt('Paste the tool URL:')
    if (url) {
      try {
        // Extract hash from full URL or use as-is if already a hash
        const hash = url.includes('#') ? '#' + url.split('#')[1] : url
        const imported = importFromURL(hash)
        saveToolSettings(imported)
        setFormValues(form, imported)
        currentParams = getFormValues(form)
        updatePreview()
        showToast('Tool settings imported successfully')
      } catch (e) {
        console.error('Failed to import URL:', e)
        showToast('Invalid tool URL', 'error')
      }
    }
    menuDropdown.classList.remove('open')
    menuTrigger.classList.remove('active')
  })

  // Settings menu action
  settingsMenuItem.addEventListener('click', () => {
    settingsModal.classList.add('open')
    updateActiveSwatch()
    menuDropdown.classList.remove('open')
    menuTrigger.classList.remove('active')
  })

  // Close settings modal
  function closeSettings() {
    settingsModal.classList.remove('open')
  }

  settingsClose.addEventListener('click', closeSettings)

  // Close modal when clicking backdrop
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings()
    }
  })

  // Prevent panel clicks from closing modal
  settingsModal.querySelector('.settings-panel')!.addEventListener('click', (e) => {
    e.stopPropagation()
  })

  // Color palette selection
  paletteSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const colorName = swatch.getAttribute('data-color') as ColorName
      if (colorName) {
        applyTheme(colorName)
        saveTheme(colorName)
        updateActiveSwatch()
      }
    })
  })

  // Initialize active swatch
  updateActiveSwatch()

  generateBtn.addEventListener('click', () => {
    if (!isFormValid(currentParams)) return

    const params = mergeWithDefaults(currentParams as { stockWidth: number; stockHeight: number } & Partial<SurfacingParams>)
    const toolpath = calculateToolpath(params)
    const gcode = generateGCode(toolpath)

    // Download
    const blob = new Blob([gcode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rastermaster-${params.stockWidth}x${params.stockHeight}.gcode`
    a.click()
    URL.revokeObjectURL(url)
  })

  // Initial preview
  updatePreview()
}

init()

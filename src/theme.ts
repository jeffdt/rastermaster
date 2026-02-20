// src/theme.ts
export type ColorName = 'amber' | 'purple' | 'green' | 'blue' | 'red' | 'cyan' | 'pink' | 'gray'

interface ColorPalette {
    hex: string
    glow: string
}

export const PALETTES: Record<ColorName, ColorPalette> = {
    amber: {
        hex: '#f59e0b',
        glow: 'rgba(245, 158, 11, 0.15)'
    },
    purple: {
        hex: '#a855f7',
        glow: 'rgba(168, 85, 247, 0.15)'
    },
    green: {
        hex: '#10b981',
        glow: 'rgba(16, 185, 129, 0.15)'
    },
    blue: {
        hex: '#3b82f6',
        glow: 'rgba(59, 130, 246, 0.15)'
    },
    red: {
        hex: '#ef4444',
        glow: 'rgba(239, 68, 68, 0.15)'
    },
    cyan: {
        hex: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.15)'
    },
    pink: {
        hex: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.15)'
    },
    gray: {
        hex: '#d1d5db',
        glow: 'rgba(209, 213, 219, 0.15)'
    }
}

const STORAGE_KEY = 'rastermaster-theme'

/**
 * Apply a color theme to the application
 */
export function applyTheme(colorName: ColorName) {
    const palette = PALETTES[colorName]
    if (!palette) {
        console.warn(`Unknown color: ${colorName}`)
        return
    }

    // Update CSS custom properties
    document.documentElement.style.setProperty('--color-accent-amber', palette.hex)
    document.documentElement.style.setProperty('--color-accent-amber-glow', palette.glow)

    // Set data attribute to indicate user has chosen a theme
    // This allows dev mode purple to be overridden via CSS specificity
    document.body.setAttribute('data-user-theme', colorName)
}

/**
 * Save the current theme to localStorage
 */
export function saveTheme(colorName: ColorName) {
    try {
        localStorage.setItem(STORAGE_KEY, colorName)
    } catch (e) {
        console.warn('Failed to save theme:', e)
    }
}

/**
 * Load and apply saved theme from localStorage
 */
export function loadTheme(): ColorName | null {
    try {
        const saved = localStorage.getItem(STORAGE_KEY) as ColorName | null
        if (saved && saved in PALETTES) {
            applyTheme(saved)
            return saved
        }
    } catch (e) {
        console.warn('Failed to load theme:', e)
    }
    return null
}

/**
 * Get the currently active theme
 */
export function getCurrentTheme(): ColorName | null {
    const userTheme = document.body.getAttribute('data-user-theme') as ColorName | null
    if (userTheme && userTheme in PALETTES) {
        return userTheme
    }
    // Check if dev mode is active and no user theme set
    if (document.body.classList.contains('is-dev')) {
        return 'purple'
    }
    return 'amber' // default
}

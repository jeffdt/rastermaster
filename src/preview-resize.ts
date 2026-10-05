type ResizeObserverLike = Pick<ResizeObserver, 'observe' | 'disconnect'>

interface ResponsivePreviewOptions {
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
  createResizeObserver?: (callback: ResizeObserverCallback) => ResizeObserverLike
}

export interface ResponsivePreviewUpdater {
  requestUpdate: () => void
  disconnect: () => void
}

/**
 * Defers preview work until layout is complete and reruns it whenever the
 * preview's own dimensions change.
 */
export function createResponsivePreviewUpdater(
  element: Element,
  render: () => void,
  options: ResponsivePreviewOptions = {},
): ResponsivePreviewUpdater {
  const requestFrame = options.requestFrame ?? window.requestAnimationFrame.bind(window)
  const cancelFrame = options.cancelFrame ?? window.cancelAnimationFrame.bind(window)
  const createResizeObserver = options.createResizeObserver
    ?? (typeof ResizeObserver === 'undefined'
      ? undefined
      : (callback: ResizeObserverCallback) => new ResizeObserver(callback))

  let frameId: number | undefined
  let disconnected = false

  const requestUpdate = () => {
    if (disconnected) return

    if (frameId !== undefined) {
      cancelFrame(frameId)
    }

    frameId = requestFrame(() => {
      frameId = undefined
      if (!disconnected) render()
    })
  }

  const resizeObserver = createResizeObserver?.(() => requestUpdate())
  resizeObserver?.observe(element)

  const handleWindowResize = () => requestUpdate()
  if (!resizeObserver) {
    window.addEventListener('resize', handleWindowResize)
  }

  requestUpdate()

  return {
    requestUpdate,
    disconnect: () => {
      disconnected = true
      resizeObserver?.disconnect()
      window.removeEventListener('resize', handleWindowResize)
      if (frameId !== undefined) {
        cancelFrame(frameId)
        frameId = undefined
      }
    },
  }
}

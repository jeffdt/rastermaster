import { describe, expect, test } from 'bun:test'
import { createResponsivePreviewUpdater } from './preview-resize'

describe('createResponsivePreviewUpdater', () => {
  test('renders after layout and coalesces form and resize updates into one frame', () => {
    const element = document.createElement('div')
    const frames = new Map<number, FrameRequestCallback>()
    let nextFrameId = 1
    let resizeCallback: ResizeObserverCallback | undefined
    let observedElement: Element | undefined
    const renderFrames: number[] = []

    const updater = createResponsivePreviewUpdater(element, () => {
      renderFrames.push(nextFrameId - 1)
    }, {
      requestFrame: (callback) => {
        const id = nextFrameId++
        frames.set(id, callback)
        return id
      },
      cancelFrame: (id) => frames.delete(id),
      createResizeObserver: (callback) => {
        resizeCallback = callback
        return {
          observe: (target) => { observedElement = target },
          disconnect: () => {},
        }
      },
    })

    expect(observedElement).toBe(element)
    expect(renderFrames).toEqual([])

    updater.requestUpdate()
    resizeCallback?.([], {} as ResizeObserver)

    expect(frames.size).toBe(1)
    const [frameId, frame] = [...frames.entries()][0]
    frames.delete(frameId)
    frame(16)

    expect(renderFrames).toEqual([3])
  })

  test('disconnects the observer and cancels a pending render', () => {
    const element = document.createElement('div')
    const frames = new Map<number, FrameRequestCallback>()
    let disconnected = false

    const updater = createResponsivePreviewUpdater(element, () => {
      throw new Error('render should not run after disconnect')
    }, {
      requestFrame: (callback) => {
        frames.set(7, callback)
        return 7
      },
      cancelFrame: (id) => frames.delete(id),
      createResizeObserver: () => ({
        observe: () => {},
        disconnect: () => { disconnected = true },
      }),
    })

    expect(frames.has(7)).toBe(true)

    updater.disconnect()

    expect(disconnected).toBe(true)
    expect(frames.size).toBe(0)
  })
})

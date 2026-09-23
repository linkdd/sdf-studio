import type { Viewport } from '@/editor/transforms'

export function createCameraControls(
  element: HTMLCanvasElement,
  camera: { current: Viewport['camera'] },
  schedule: () => void
) {
  let pointer: { id: number; x: number; y: number } | null = null

  function down(event: PointerEvent) {
    if (event.button !== 0 && event.button !== 1) {
      return
    }

    event.preventDefault()
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
    element.setPointerCapture(event.pointerId)
    element.classList.add('is-panning')
  }

  function move(event: PointerEvent) {
    if (!pointer || pointer.id !== event.pointerId) {
      return
    }

    const scale = camera.current.height / element.getBoundingClientRect().height

    camera.current.x -= (event.clientX - pointer.x) * scale
    camera.current.y += (event.clientY - pointer.y) * scale
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY }
    schedule()
  }

  function up(event: PointerEvent) {
    if (pointer?.id !== event.pointerId) {
      return
    }

    pointer = null

    if (element.hasPointerCapture(event.pointerId)) {
      element.releasePointerCapture(event.pointerId)
    }

    element.classList.remove('is-panning')
  }

  function wheel(event: WheelEvent) {
    event.preventDefault()

    if (element.parentElement?.querySelector('.transform-gizmo.is-dragging')) {
      return
    }

    const bounds = element.getBoundingClientRect()
    const oldHeight = camera.current.height
    const delta =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1)
    const nextHeight = Math.max(
      0.01,
      Math.min(
        10000,
        oldHeight * Math.exp(Math.max(-1, Math.min(1, delta * 0.001)))
      )
    )

    camera.current.x +=
      ((event.clientX - bounds.left - bounds.width / 2) / bounds.height) *
      (oldHeight - nextHeight)
    camera.current.y +=
      ((bounds.height / 2 - event.clientY + bounds.top) / bounds.height) *
      (oldHeight - nextHeight)
    camera.current.height = nextHeight
    schedule()
  }

  return { down, move, up, wheel }
}

import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import type { Transform } from '@/editor/nodes'
import type { Point } from '@/editor/polygon'
import {
  angleDelta,
  moveTransform,
  scaleTransform,
  screenToWorld,
  worldToScreen,
} from '@/editor/transforms'
import type { GizmoHandle, Viewport } from '@/editor/transforms'

import type { Drag, GizmoProps } from '@/components/gizmo/types'

export function useGizmoInteraction({ selection, view, onChange }: GizmoProps) {
  const svg = useRef<SVGSVGElement>(null)
  const frame = useRef(0)
  const pending = useRef<Transform | null>(null)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const drag = useRef<Drag | null>(null)
  const [active, setActive] = useState<GizmoHandle | null>(null)
  const { node, parent, world } = selection
  const center = worldToScreen(world, view)
  const parentAngle = (parent.rotation * Math.PI) / 180
  const worldAngle = (world.rotation * Math.PI) / 180

  function radial(angle: number, radius: number): Point {
    return {
      x: center.x + Math.cos(angle) * radius,
      y: center.y - Math.sin(angle) * radius,
    }
  }

  const xHandle = radial(parentAngle, 52)
  const yHandle = radial(parentAngle + Math.PI / 2, 52)
  const scaleHandle = radial(worldAngle - Math.PI / 4, 72)
  const rotateHandle = radial(worldAngle + Math.PI / 2, 92)

  function pointerWorld(event: PointerEvent<SVGElement>, snapshot: Viewport) {
    const bounds = svg.current!.getBoundingClientRect()

    return screenToWorld(
      { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
      snapshot
    )
  }

  function begin(event: PointerEvent<SVGElement>, handle: GizmoHandle) {
    if (event.button !== 0 || drag.current) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.focus()

    const from = pointerWorld(event, view)

    drag.current = {
      handle,
      pointerId: event.pointerId,
      start: node.transform,
      parent,
      center: world,
      from,
      view,
      angle: Math.atan2(from.y - world.y, from.x - world.x),
      rotation: node.transform.rotation,
    }
    setActive(handle)
    svg.current!.setPointerCapture(event.pointerId)
  }

  function update(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current

    if (!current || current.pointerId !== event.pointerId) {
      return
    }

    const to = pointerWorld(event, current.view)
    let next: Transform

    if (current.handle === 'rotate') {
      if (Math.hypot(to.x - current.center.x, to.y - current.center.y) < 1e-8) {
        return
      }

      const angle = Math.atan2(to.y - current.center.y, to.x - current.center.x)

      current.rotation += (angleDelta(current.angle, angle) * 180) / Math.PI
      current.angle = angle
      next = {
        ...current.start,
        rotation: event.shiftKey
          ? Math.round(current.rotation / 15) * 15
          : current.rotation,
      }
    } else if (current.handle === 'scale') {
      next = scaleTransform(
        current.start,
        current.center,
        current.from,
        to,
        event.shiftKey
      )
    } else {
      next = moveTransform(
        current.start,
        current.parent,
        current.from,
        to,
        current.handle,
        event.shiftKey
      )
    }

    if (Object.values(next).every(Number.isFinite)) {
      pending.current = next

      if (!frame.current) {
        frame.current = requestAnimationFrame(() => {
          frame.current = 0

          if (pending.current) {
            onChange(node.id, pending.current)
          }

          pending.current = null
        })
      }
    }
  }

  function finish(cancel = false) {
    const current = drag.current

    if (!current) {
      return
    }

    cancelAnimationFrame(frame.current)
    frame.current = 0

    if (!cancel && pending.current) {
      onChange(node.id, pending.current)
    }

    pending.current = null
    drag.current = null
    setActive(null)

    if (cancel) {
      onChange(node.id, current.start)
    }

    if (svg.current?.hasPointerCapture(current.pointerId)) {
      svg.current.releasePointerCapture(current.pointerId)
    }
  }

  function keyboard(event: KeyboardEvent<SVGElement>, handle: GizmoHandle) {
    if (event.key === 'Escape' && drag.current) {
      event.preventDefault()
      event.stopPropagation()
      finish(true)

      return
    }

    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(
        event.key
      ) ||
      drag.current
    ) {
      return
    }

    event.preventDefault()

    const positive = event.key === 'ArrowRight' || event.key === 'ArrowUp'
    const step = (event.shiftKey ? 0.1 : 0.01) * (positive ? 1 : -1)
    const next = { ...node.transform }

    if (handle === 'rotate') {
      next.rotation += (event.shiftKey ? 15 : 1) * (positive ? 1 : -1)
    } else if (handle === 'scale') {
      next.scale = Math.max(0.001, next.scale + step)
    } else if (handle === 'move-x') {
      next.x += step
    } else if (handle === 'move-y') {
      next.y += step
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      next.x += step
    } else {
      next.y += step
    }

    onChange(node.id, next)
  }

  const handleProps = (handle: GizmoHandle, label: string) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': label,
    'data-handle': handle,
    onPointerDown: (event: PointerEvent<SVGElement>) => begin(event, handle),
    onKeyDown: (event: KeyboardEvent<SVGElement>) => keyboard(event, handle),
  })

  return {
    svg,
    active,
    node,
    center,
    xHandle,
    yHandle,
    scaleHandle,
    rotateHandle,
    handleProps,
    update,
    finish,
    drag,
  }
}

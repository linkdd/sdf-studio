import { useId, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

import {
  fitPolygon,
  fromPolygonCanvas,
  insertVertex,
  removeVertex,
  toPolygonCanvas,
} from '@/editor/polygon'
import type { Point } from '@/editor/polygon'

import type { PolygonEditorProps } from '@/components/polygon/types'

export function usePolygonEditor({ vertices, onChange }: PolygonEditorProps) {
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ index: number; pointerId: number } | null>(null)
  const gridId = useId()
  const [selection, setSelection] = useState(0)
  const [view, setView] = useState(() => fitPolygon(vertices))
  const selected = Math.min(selection, vertices.length - 1)
  const point = vertices[selected]
  const projected = vertices.map((vertex) => toPolygonCanvas(vertex, view))
  const outline = projected.map((vertex) => vertex.x + ',' + vertex.y).join(' ')
  const origin = toPolygonCanvas({ x: 0, y: 0 }, view)

  function moveVertex(index: number, point: Point) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      return
    }

    onChange(
      vertices.map((vertex, current) => (current === index ? point : vertex))
    )
  }

  function addVertex(after: number) {
    onChange(insertVertex(vertices, after))
    setSelection(after + 1)
  }

  function deleteVertex(index: number) {
    if (vertices.length <= 3) {
      return
    }

    onChange(removeVertex(vertices, index))
    setSelection(Math.min(index, vertices.length - 2))
  }

  function loseCapture() {
    drag.current = null
  }

  function beginDrag(event: PointerEvent<SVGCircleElement>, index: number) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    setSelection(index)
    event.currentTarget.focus()
    drag.current = { index, pointerId: event.pointerId }
    svg.current?.setPointerCapture(event.pointerId)
  }

  function dragVertex(event: PointerEvent<SVGSVGElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) {
      return
    }

    const matrix = event.currentTarget.getScreenCTM()

    if (!matrix) {
      return
    }

    const position = new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse()
    )
    const next = fromPolygonCanvas(position, view)

    moveVertex(drag.current.index, {
      x: Number(next.x.toFixed(4)),
      y: Number(next.y.toFixed(4)),
    })
  }

  function stopDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current?.pointerId !== event.pointerId) {
      return
    }

    drag.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function vertexKey(event: KeyboardEvent<SVGCircleElement>, index: number) {
    const steps: Record<string, Point> = {
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
      ArrowUp: { x: 0, y: 1 },
      ArrowDown: { x: 0, y: -1 },
    }

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault()
      deleteVertex(index)
    } else if (steps[event.key]) {
      event.preventDefault()

      const step = event.shiftKey ? 0.1 : 0.01

      moveVertex(index, {
        x: Number((vertices[index].x + steps[event.key].x * step).toFixed(4)),
        y: Number((vertices[index].y + steps[event.key].y * step).toFixed(4)),
      })
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelection(index)
    }
  }

  return {
    svg,
    beginDrag,
    loseCapture,
    gridId,
    selected,
    point,
    projected,
    outline,
    origin,
    setSelection,
    setView,
    moveVertex,
    addVertex,
    deleteVertex,
    dragVertex,
    stopDrag,
    vertexKey,
  }
}

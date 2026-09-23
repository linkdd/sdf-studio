import type { Transform } from '@/editor/nodes'
import type { Point } from '@/editor/polygon'
import type { GizmoHandle, NodeTransform, Viewport } from '@/editor/transforms'

export interface GizmoProps {
  selection: NodeTransform
  view: Viewport
  onChange: (id: string, transform: Transform) => void
}

export interface Drag {
  handle: GizmoHandle
  pointerId: number
  start: Transform
  parent: Transform
  center: Point
  from: Point
  view: Viewport
  angle: number
  rotation: number
}

import type { SceneNode, SceneRoot, Transform } from '@/editor/nodes.ts'
import type { Point } from '@/editor/polygon.ts'

export const identityTransform: Transform = {
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
}

export function transformPoint(point: Point, transform: Transform): Point {
  const angle = (transform.rotation * Math.PI) / 180
  const c = Math.cos(angle),
    s = Math.sin(angle)

  return {
    x: transform.x + transform.scale * (c * point.x - s * point.y),
    y: transform.y + transform.scale * (s * point.x + c * point.y),
  }
}

export function inverseTransformPoint(
  point: Point,
  transform: Transform
): Point {
  const angle = (transform.rotation * Math.PI) / 180
  const c = Math.cos(angle),
    s = Math.sin(angle)
  const x = (point.x - transform.x) / transform.scale,
    y = (point.y - transform.y) / transform.scale

  return { x: c * x + s * y, y: -s * x + c * y }
}

export function composeTransforms(
  parent: Transform,
  local: Transform
): Transform {
  return {
    ...transformPoint(local, parent),
    rotation: parent.rotation + local.rotation,
    scale: parent.scale * local.scale,
  }
}

export interface NodeTransform {
  node: SceneNode
  parent: Transform
  world: Transform
}

export function findNodeTransform(
  root: SceneRoot,
  id: string
): NodeTransform | null {
  function visit(
    nodes: readonly SceneNode[],
    parent: Transform
  ): NodeTransform | null {
    for (const node of nodes) {
      const world = composeTransforms(parent, node.transform)

      if (node.id === id) {
        return { node, parent, world }
      }

      const found = visit(node.children, world)

      if (found) {
        return found
      }
    }

    return null
  }

  return visit(root.children, identityTransform)
}

export interface Viewport {
  width: number
  height: number
  camera: { x: number; y: number; height: number }
}

export function worldToScreen(point: Point, view: Viewport): Point {
  const pixels = view.height / view.camera.height

  return {
    x: view.width / 2 + (point.x - view.camera.x) * pixels,
    y: view.height / 2 - (point.y - view.camera.y) * pixels,
  }
}

export function screenToWorld(point: Point, view: Viewport): Point {
  const units = view.camera.height / view.height

  return {
    x: view.camera.x + (point.x - view.width / 2) * units,
    y: view.camera.y - (point.y - view.height / 2) * units,
  }
}

export type GizmoHandle = 'move' | 'move-x' | 'move-y' | 'rotate' | 'scale'

const snapTo = (value: number, step: number) => Math.round(value / step) * step

export function moveTransform(
  start: Transform,
  parent: Transform,
  from: Point,
  to: Point,
  handle: GizmoHandle,
  snap: boolean
): Transform {
  const a = inverseTransformPoint(from, parent),
    b = inverseTransformPoint(to, parent)
  let x = start.x + b.x - a.x,
    y = start.y + b.y - a.y

  if (snap) {
    x = snapTo(x, 0.1)
    y = snapTo(y, 0.1)
  }

  return {
    ...start,
    x: handle === 'move-y' ? start.x : x,
    y: handle === 'move-x' ? start.y : y,
  }
}

export function scaleTransform(
  start: Transform,
  center: Point,
  from: Point,
  to: Point,
  snap: boolean
): Transform {
  const x = from.x - center.x,
    y = from.y - center.y
  const denominator = x * x + y * y

  if (denominator < 1e-20) {
    return start
  }

  let scale =
    (start.scale * ((to.x - center.x) * x + (to.y - center.y) * y)) /
    denominator

  if (snap) {
    scale = snapTo(scale, 0.1)
  }

  return { ...start, scale: Math.max(0.001, scale) }
}

export function angleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

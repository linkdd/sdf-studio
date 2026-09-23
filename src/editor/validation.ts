import { parseGeometry } from '@/editor/geometry.ts'
import { isOperation, nodeDefinitions } from '@/editor/nodes.ts'
import type {
  Appearance,
  Blending,
  NodeKind,
  SceneNode,
  SceneRoot,
  ShapeNode,
  Transform,
} from '@/editor/nodes.ts'
import { isPolygonVertices } from '@/editor/polygon.ts'
import { createScene } from '@/editor/tree.ts'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function color(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
}

function parseTransform(value: unknown): Transform {
  if (
    !isRecord(value) ||
    !finite(value.x) ||
    !finite(value.y) ||
    !finite(value.rotation) ||
    !finite(value.scale) ||
    value.scale <= 0
  ) {
    throw new Error('Invalid transform')
  }

  return {
    x: value.x,
    y: value.y,
    rotation: value.rotation,
    scale: value.scale,
  }
}

function parseStyle(value: unknown): Appearance {
  if (
    !isRecord(value) ||
    !isRecord(value.fill) ||
    !isRecord(value.stroke) ||
    typeof value.fill.enabled !== 'boolean' ||
    !color(value.fill.color) ||
    typeof value.stroke.enabled !== 'boolean' ||
    !color(value.stroke.color) ||
    !finite(value.stroke.width) ||
    value.stroke.width < 0
  ) {
    throw new Error('Invalid style')
  }

  return {
    fill: { enabled: value.fill.enabled, color: value.fill.color },
    stroke: {
      enabled: value.stroke.enabled,
      color: value.stroke.color,
      width: value.stroke.width,
    },
  }
}

function parseBlend(value: unknown): Blending {
  if (
    !isRecord(value) ||
    (value.transition !== 'sharp' && value.transition !== 'smooth') ||
    !finite(value.radius) ||
    value.radius <= 0
  ) {
    throw new Error('Invalid blending')
  }

  return { transition: value.transition, radius: value.radius }
}

// Shared by local persistence and JSON import; builds a fresh, validated model.
export function parseScene(value: unknown): SceneRoot {
  const root = value

  if (
    !isRecord(root) ||
    root.id !== 'scene' ||
    root.kind !== 'root' ||
    root.name !== 'Scene' ||
    !Array.isArray(root.children)
  ) {
    throw new Error('Invalid scene root')
  }

  const ids = new Set(['scene'])

  function nodeRecord(value: unknown) {
    if (
      !isRecord(value) ||
      typeof value.id !== 'string' ||
      !value.id ||
      ids.has(value.id) ||
      !nodeDefinitions.some((definition) => definition.kind === value.kind) ||
      typeof value.name !== 'string' ||
      !Array.isArray(value.children)
    ) {
      throw new Error(
        'Invalid scene node (check IDs, kind, name, and children)'
      )
    }

    ids.add(value.id)

    return {
      id: value.id,
      kind: value.kind as NodeKind,
      name: value.name,
      children: value.children,
      value,
    }
  }

  function parseNode(value: unknown): SceneNode {
    const record = nodeRecord(value)
    const { id, kind, name, children } = record
    const transform = parseTransform(record.value.transform)

    if (kind === 'group') {
      return { id, kind, name, transform, children: children.map(parseNode) }
    }

    if (isOperation(kind)) {
      return {
        id,
        kind,
        name,
        transform,
        blend: parseBlend(record.value.blend),
        children: children.map(parseNode),
      }
    }

    const style = parseStyle(record.value.style)

    if (children.length) {
      throw new Error('Shapes must be leaves')
    }

    if (kind === 'polygon') {
      if (!isPolygonVertices(record.value.vertices)) {
        throw new Error('Invalid polygon vertices')
      }

      return {
        id,
        kind,
        name,
        transform,
        style,
        vertices: record.value.vertices.map(({ x, y }) => ({ x, y })),
        children: [],
      }
    }

    return {
      id,
      kind,
      name,
      transform,
      style,
      ...parseGeometry(kind, record.value),
      children: [],
    } as ShapeNode
  }

  return { ...createScene(), children: root.children.map(parseNode) }
}

import { defaultGeometry } from '@/editor/geometry.ts'
import type {
  GeometryByKind,
  GeometryProperties,
  PrimitiveKind,
} from '@/editor/geometry.ts'
import { nodeDefinitions } from '@/editor/nodeDefinitions.ts'
import { defaultPolygon } from '@/editor/polygon.ts'
import type { Point } from '@/editor/polygon.ts'

export { nodeDefinitions } from '@/editor/nodeDefinitions.ts'

export type NodeKind = (typeof nodeDefinitions)[number]['kind']

export type OperationKind = 'union' | 'subtract' | 'intersect'

export type ShapeKind = Exclude<NodeKind, OperationKind | 'group'>

export interface Transform {
  readonly x: number
  readonly y: number
  readonly rotation: number // Degrees, relative to the parent.
  readonly scale: number // Uniform positive scale preserves distance semantics.
}

export interface Appearance {
  readonly fill: { readonly enabled: boolean; readonly color: string }
  readonly stroke: {
    readonly enabled: boolean
    readonly color: string
    readonly width: number
  }
}

interface BaseNode {
  readonly id: string
  readonly name: string
  readonly transform: Transform
}

type PrimitiveNode = {
  [K in PrimitiveKind]: BaseNode &
    GeometryByKind[K] & {
      readonly kind: K
      readonly style: Appearance
      readonly children: readonly []
    }
}[PrimitiveKind]

export interface PolygonNode extends BaseNode {
  readonly kind: 'polygon'
  readonly vertices: readonly Point[]
  readonly style: Appearance
  readonly children: readonly []
}

export type ShapeNode = PrimitiveNode | PolygonNode

export interface GroupNode extends BaseNode {
  readonly kind: 'group'
  readonly children: readonly SceneNode[]
}

export interface Blending {
  readonly transition: 'sharp' | 'smooth'
  readonly radius: number // Positive, in local scene units; ignored for sharp transitions.
}

export interface OperationNode extends BaseNode {
  readonly kind: OperationKind
  readonly blend: Blending
  readonly children: readonly SceneNode[]
}

export type SceneNode = ShapeNode | GroupNode | OperationNode

export interface NodeProperties extends GeometryProperties {
  name?: string
  transform?: Transform
  style?: Appearance
  blend?: Blending
  vertices?: readonly Point[]
}

export interface SceneRoot {
  readonly id: 'scene'
  readonly kind: 'root'
  readonly name: 'Scene'
  readonly children: readonly SceneNode[]
}

export type SceneBranch = SceneRoot | SceneNode

export type SceneContainer = SceneRoot | GroupNode | OperationNode

export type NodeDrag =
  { source: 'library'; kind: NodeKind } | { source: 'scene'; id: string }

export function isOperation(kind: string): kind is OperationKind {
  return kind === 'union' || kind === 'subtract' || kind === 'intersect'
}

export function canHaveChildren(node: SceneBranch): node is SceneContainer {
  return node.kind === 'root' || node.kind === 'group' || isOperation(node.kind)
}

export function defaultStyle(color = '#8dddc7'): Appearance {
  return {
    fill: { enabled: true, color },
    stroke: { enabled: false, color, width: 0.02 },
  }
}

export function createNode(
  kind: NodeKind,
  id: string,
  name?: string
): SceneNode {
  const base = {
    id,
    name:
      name ??
      nodeDefinitions.find((definition) => definition.kind === kind)!.label +
        ' ' +
        id,
    transform: { x: 0, y: 0, rotation: 0, scale: 1 },
  }

  if (kind === 'group') {
    return { ...base, kind, children: [] }
  }

  if (isOperation(kind)) {
    return {
      ...base,
      kind,
      blend: { transition: 'sharp', radius: 0.1 },
      children: [],
    }
  }

  if (kind === 'polygon') {
    return {
      ...base,
      kind,
      vertices: defaultPolygon(),
      style: defaultStyle(),
      children: [],
    }
  }

  const style = defaultStyle()

  if (kind === 'segment') {
    return {
      ...base,
      kind,
      ...defaultGeometry(kind),
      style: {
        fill: { ...style.fill, enabled: false },
        stroke: { ...style.stroke, enabled: true },
      },
      children: [],
    }
  }

  return {
    ...base,
    kind,
    ...defaultGeometry(kind),
    style,
    children: [],
  } as PrimitiveNode
}

export function nodeColor(node: SceneNode): string {
  if (!('style' in node)) {
    return '#b7c8d5'
  }

  return node.style.fill.enabled
    ? node.style.fill.color
    : node.style.stroke.enabled
      ? node.style.stroke.color
      : '#778594'
}

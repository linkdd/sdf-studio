import type { NodeProperties, SceneNode } from '@/editor/nodes.ts'

interface GeometryField {
  readonly key: string
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly integer: boolean
}

const dimension = <K extends string>(key: K, label: string, value: number) => ({
  key,
  label,
  value,
  min: 1e-6,
  max: 1e30,
  step: 0.1,
  integer: false,
})
const coordinate = <K extends string>(
  key: K,
  label: string,
  value: number
) => ({ ...dimension(key, label, value), min: -1e30 })

// Defaults, controls, and validation share the same geometry definitions.
export const geometryDefinitions = {
  circle: [dimension('radius', 'Radius', 1)],
  box: [dimension('width', 'Width', 1.6), dimension('height', 'Height', 1.2)],
  'rounded-box': [
    dimension('width', 'Width', 1.6),
    dimension('height', 'Height', 1.2),
    { ...dimension('cornerRadius', 'Corner radius', 0.2), min: 0 },
  ],
  triangle: [
    dimension('width', 'Width', Math.sqrt(3)),
    dimension('height', 'Height', 1.5),
  ],
  ellipse: [
    dimension('radiusX', 'Radius X', 1),
    dimension('radiusY', 'Radius Y', 0.6),
  ],
  capsule: [
    coordinate('startX', 'Start X', -0.6),
    coordinate('startY', 'Start Y', 0),
    coordinate('endX', 'End X', 0.6),
    coordinate('endY', 'End Y', 0),
    dimension('radius', 'Radius', 0.3),
  ],
  segment: [
    coordinate('startX', 'Start X', -0.8),
    coordinate('startY', 'Start Y', 0),
    coordinate('endX', 'End X', 0.8),
    coordinate('endY', 'End Y', 0),
  ],
  star: [
    dimension('outerRadius', 'Outer radius', 1),
    dimension('innerRadius', 'Inner radius', 0.45),
    {
      key: 'points',
      label: 'Points',
      value: 5,
      min: 3,
      max: 64,
      step: 1,
      integer: true,
    },
  ],
  arc: [
    dimension('radius', 'Radius', 0.8),
    dimension('tubeRadius', 'Tube radius', 0.1),
    { ...coordinate('startAngle', 'Start angle (°)', -45), step: 1 },
    {
      key: 'sweepAngle',
      label: 'Sweep (°)',
      value: 270,
      min: 0,
      max: 360,
      step: 1,
      integer: false,
    },
  ],
} as const satisfies Record<string, readonly GeometryField[]>

export type PrimitiveKind = keyof typeof geometryDefinitions

export type GeometryByKind = {
  [K in PrimitiveKind]: {
    readonly [F in (typeof geometryDefinitions)[K][number]['key']]: number
  }
}

export type GeometryProperties = Partial<{
  [K in (typeof geometryDefinitions)[PrimitiveKind][number]['key']]: number
}>

export function isPrimitiveKind(kind: string): kind is PrimitiveKind {
  return Object.hasOwn(geometryDefinitions, kind)
}

export function isGeometryValue(
  field: GeometryField,
  value: unknown
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= field.min &&
    value <= field.max &&
    (!field.integer || Number.isInteger(value))
  )
}

export function defaultGeometry<K extends PrimitiveKind>(
  kind: K
): GeometryByKind[K] {
  return Object.fromEntries(
    geometryDefinitions[kind].map((field) => [field.key, field.value])
  ) as GeometryByKind[K]
}

export function parseGeometry<K extends PrimitiveKind>(
  kind: K,
  source: object
): GeometryByKind[K] {
  const values = source as Record<string, unknown>
  const entries = geometryDefinitions[kind].map((field) => {
    if (!isGeometryValue(field, values[field.key])) {
      const label =
        kind === 'box' || kind === 'rounded-box'
          ? 'rectangle dimensions'
          : `${kind} geometry`

      throw new Error(
        `Invalid ${label}: ${field.label} must be ${field.integer ? 'an integer ' : ''}between ${field.min} and ${field.max}.`
      )
    }

    return [field.key, values[field.key]]
  })

  return Object.fromEntries(entries) as GeometryByKind[K]
}

export function updateGeometry(
  node: SceneNode,
  properties: NodeProperties
): GeometryProperties {
  if (!isPrimitiveKind(node.kind)) {
    return {}
  }

  return Object.fromEntries(
    geometryDefinitions[node.kind]
      .filter((field) => isGeometryValue(field, properties[field.key]))
      .map((field) => [field.key, properties[field.key]])
  )
}

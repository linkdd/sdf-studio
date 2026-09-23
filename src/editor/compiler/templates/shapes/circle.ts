import { scalar } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function circleTemplate({ radius }: GeometryByKind['circle']): string {
  return `float d = length(q) - ${scalar(radius)};`
}

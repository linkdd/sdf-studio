import { polygonTemplate } from '@/editor/compiler/templates/shapes/polygon.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function triangleTemplate({
  width,
  height,
}: GeometryByKind['triangle']): string {
  return polygonTemplate([
    { x: 0, y: (height * 2) / 3 },
    { x: -width / 2, y: -height / 3 },
    { x: width / 2, y: -height / 3 },
  ])
}

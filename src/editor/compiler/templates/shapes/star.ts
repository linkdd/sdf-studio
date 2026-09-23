import { polygonTemplate } from '@/editor/compiler/templates/shapes/polygon.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function starTemplate({
  points,
  innerRadius,
  outerRadius,
}: GeometryByKind['star']): string {
  const vertices = Array.from({ length: points * 2 }, (_, index) => {
    const angle = Math.PI / 2 + (index * Math.PI) / points
    const radius = index % 2 ? innerRadius : outerRadius

    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })

  return polygonTemplate(vertices)
}

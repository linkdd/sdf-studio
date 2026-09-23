import { vec } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function ellipseTemplate({
  radiusX,
  radiusY,
}: GeometryByKind['ellipse']): string {
  return `float d = sdf_ellipse(q, ${vec(radiusX, radiusY)});`
}

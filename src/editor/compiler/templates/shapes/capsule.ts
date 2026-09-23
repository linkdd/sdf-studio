import { scalar, vec } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function capsuleTemplate({
  startX,
  startY,
  endX,
  endY,
  radius,
}: GeometryByKind['capsule']): string {
  return `float d = sdf_segment(q, ${vec(startX, startY)}, ${vec(endX, endY)}) - ${scalar(radius)};`
}

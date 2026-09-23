import { vec } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function segmentTemplate({
  startX,
  startY,
  endX,
  endY,
}: GeometryByKind['segment']): string {
  return `float d = sdf_segment(q, ${vec(startX, startY)}, ${vec(endX, endY)});`
}

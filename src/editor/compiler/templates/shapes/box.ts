import { scalar, vec } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function boxTemplate({
  width,
  height,
  cornerRadius = 0,
}: GeometryByKind['box'] & { cornerRadius?: number }): string {
  const halfWidth = width / 2
  const halfHeight = height / 2
  // Keep the outer dimensions exact when the requested corners do not fit.
  const radius = Math.min(cornerRadius, halfWidth, halfHeight)

  return `float d = sdf_box(q, ${vec(halfWidth, halfHeight)} - vec2(${scalar(radius)})) - ${scalar(radius)};`
}

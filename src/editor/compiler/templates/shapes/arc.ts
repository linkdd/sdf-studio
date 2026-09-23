import { scalar, vec } from '@/editor/compiler/literals.ts'
import type { GeometryByKind } from '@/editor/geometry.ts'

export function arcTemplate({
  startAngle,
  sweepAngle,
  radius,
  tubeRadius,
}: GeometryByKind['arc']): string {
  const start = ((((startAngle % 360) + 360) % 360) * Math.PI) / 180
  const sweep = (sweepAngle * Math.PI) / 180

  if (sweepAngle === 360) {
    return `float d = abs(length(q) - ${scalar(radius)}) - ${scalar(tubeRadius)};`
  }

  const a = vec(Math.cos(start) * radius, Math.sin(start) * radius)
  const b = vec(
    Math.cos(start + sweep) * radius,
    Math.sin(start + sweep) * radius
  )

  return `float angle = dot(q, q) > 0.0 ? atan(q.y, q.x) : 0.0;
    float relativeAngle = mod(angle - ${scalar(start)} + 6.283185307179586, 6.283185307179586);
    float d = (relativeAngle <= ${scalar(sweep)} ? abs(length(q) - ${scalar(radius)})
        : min(length(q - ${a}), length(q - ${b}))) - ${scalar(tubeRadius)};`
}

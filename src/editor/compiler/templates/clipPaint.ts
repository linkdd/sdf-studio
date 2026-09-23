import type { NodeFunctions } from '@/editor/compiler/types.ts'
import type { ClipEdge } from '@/editor/nodes.ts'

export function clipPaintTemplate(
  local: string,
  scale: string,
  children: readonly NodeFunctions[],
  edge: ClipEdge
): string {
  const base = children[0]
  const stroke =
    edge === 'center'
      ? ''
      : `
    sdf_Material baseMaterial = ${base.material}(q);
    float halfStroke = baseMaterial.stroke.a > 0.0 ? baseMaterial.width * 0.5 : 0.0;`
  const distance =
    `${base.distance}(q)` +
    (edge === 'outer'
      ? ' - halfStroke'
      : edge === 'inner'
        ? ' + halfStroke'
        : '')
  const layers = children
    .slice(1)
    .map(
      (child) =>
        `result = sdf_over(${child.paint}(q, localPixelSize) * mask, result);`
    )

  return `${local}
    float localPixelSize = pixelSize / ${scale};
    float aa = max(localPixelSize * 0.75, 1e-7);${stroke}
    float mask = 1.0 - smoothstep(-aa, aa, ${distance});
    vec4 result = ${base.paint}(q, localPixelSize);
    ${layers.join('\n    ')}
    return result;`
}

import type { NodeFunctions } from '@/editor/compiler/types.ts'

export function clipPaintTemplate(
  local: string,
  scale: string,
  children: readonly NodeFunctions[]
): string {
  const base = children[0]
  const layers = children
    .slice(1)
    .map(
      (child) =>
        `result = sdf_over(${child.paint}(q, localPixelSize) * mask, result);`
    )

  return `${local}
    float localPixelSize = pixelSize / ${scale};
    float aa = max(localPixelSize * 0.75, 1e-7);
    float mask = 1.0 - smoothstep(-aa, aa, ${base.distance}(q));
    vec4 result = ${base.paint}(q, localPixelSize);
    ${layers.join('\n    ')}
    return result;`
}

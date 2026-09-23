import { scalar } from '@/editor/compiler/literals.ts'
import type { NodeFunctions } from '@/editor/compiler/types.ts'
import type { SceneNode } from '@/editor/nodes.ts'

export function materialBodyTemplate(
  node: SceneNode,
  active: readonly NodeFunctions[],
  empty: boolean,
  local: string,
  appearance: string | null
): string {
  let material: string

  if (empty) {
    material = 'sdf_Material result = sdf_Material(vec4(0.0), vec4(0.0), 0.0);'
  } else if ('style' in node) {
    material = `sdf_Material result = ${appearance};`
  } else {
    material = `${local}\n    sdf_Material result = ${active[0].material}(q);`

    // Subtract and Clip expose their base material when used as Boolean operands.
    if (node.kind !== 'subtract' && node.kind !== 'clip' && active.length > 1) {
      material += `\n    float d = ${active[0].distance}(q);`

      for (const child of active.slice(1)) {
        const maximum = node.kind === 'intersect'
        const smooth = 'blend' in node && node.blend.transition === 'smooth'
        const difference = maximum ? '(d - nextDistance)' : '(nextDistance - d)'
        const comparison = maximum ? '>' : '<'
        const operator = smooth
          ? maximum
            ? 'sdf_smoothMax'
            : 'sdf_smoothMin'
          : maximum
            ? 'max'
            : 'min'
        const radius = smooth ? ', ' + scalar(node.blend.radius) : ''
        const h = smooth
          ? `clamp(0.5 + 0.5 * ${difference} / ${scalar(node.blend.radius)}, 0.0, 1.0)`
          : `(d ${comparison} nextDistance ? 1.0 : 0.0)`

        material += `
    {
        float nextDistance = ${child.distance}(q);
        float h = ${h};
        result = sdf_mixMaterial(${child.material}(q), result, h);
        d = ${operator}(d, nextDistance${radius});
    }`
      }
    }
  }

  return material
}

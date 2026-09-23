import { scalar } from '@/editor/compiler/literals.ts'
import { shapeBody } from '@/editor/compiler/shape.ts'
import type { NodeFunctions } from '@/editor/compiler/types.ts'
import type { SceneNode, ShapeNode } from '@/editor/nodes.ts'

export function distanceBodyTemplate(
  node: SceneNode,
  active: readonly NodeFunctions[],
  empty: boolean,
  container: boolean
): string {
  let body: string

  if (empty) {
    body = 'float d = 1e20;'
  } else if (container) {
    body = `float d = ${active[0].distance}(q);`

    for (const child of active.slice(1)) {
      const operand = `${child.distance}(q)`
      const cut = node.kind === 'subtract' ? `-(${operand})` : operand
      const maximum = node.kind === 'subtract' || node.kind === 'intersect'
      const smooth = 'blend' in node && node.blend.transition === 'smooth'

      if (smooth && node.blend.radius < 1e-6) {
        throw new Error(
          'Smooth radii must be at least 0.000001 for shader precision.'
        )
      }

      const operator = smooth
        ? maximum
          ? 'sdf_smoothMax'
          : 'sdf_smoothMin'
        : maximum
          ? 'max'
          : 'min'
      const radius = smooth ? ', ' + scalar(node.blend.radius) : ''

      body += `
    d = ${operator}(d, ${cut}${radius});`
    }
  } else {
    body = shapeBody(node as ShapeNode)
  }

  return body
}

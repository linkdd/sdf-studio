import { materialExpression } from '@/editor/compiler/templates/materialExpression.ts'
import type { SceneUniform } from '@/editor/compiler/types.ts'
import type { Appearance } from '@/editor/nodes.ts'

export function compileAppearance(
  style: Appearance,
  name: string,
  dynamic: boolean,
  declarations: string[],
  uniforms: SceneUniform[]
): string {
  // Validate the same values in both modes; exports still embed literal colors.
  const expression = materialExpression(style)

  if (!dynamic) {
    return expression
  }

  function rgba(paint: Appearance['fill']) {
    return new Float32Array(
      paint.enabled
        ? [
            ...[1, 3, 5].map(
              (start) => parseInt(paint.color.slice(start, start + 2), 16) / 255
            ),
            1,
          ]
        : [0, 0, 0, 0]
    )
  }

  const fill = name + '_fill'
  const stroke = name + '_stroke'
  const width = name + '_strokeWidth'

  declarations.push(
    `uniform vec4 ${fill};`,
    `uniform vec4 ${stroke};`,
    `uniform float ${width};`
  )
  uniforms.push(
    { name: fill, values: rgba(style.fill) },
    { name: stroke, values: rgba(style.stroke) },
    { name: width, values: new Float32Array([style.stroke.width]) }
  )

  return `sdf_Material(${fill}, ${stroke}, ${width})`
}

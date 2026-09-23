import { scalar, vec } from '@/editor/compiler/literals.ts'
import { localTransformTemplate } from '@/editor/compiler/templates/localTransform.ts'
import type { SceneUniform } from '@/editor/compiler/types.ts'
import type { SceneNode } from '@/editor/nodes.ts'

export function compileTransform(
  node: SceneNode,
  name: string,
  dynamicTransforms: boolean,
  declarations: string[],
  uniforms: SceneUniform[]
) {
  const { x, y, rotation, scale } = node.transform

  if (scale < 1e-6) {
    throw new Error(
      'Node scales must be at least 0.000001 for shader precision.'
    )
  }

  const angle = ((rotation % 360) * Math.PI) / 180

  // Keep validation identical for the preview and self-contained export.
  scalar(x)
  scalar(y)
  scalar(scale)
  scalar(angle)

  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  let c = scalar(cosine)
  let s = scalar(sine)
  let position = vec(x, y)
  let scaleValue = scalar(scale)

  if (dynamicTransforms) {
    const pose = name + '_pose'
    const size = name + '_scale'

    declarations.push(`uniform vec4 ${pose};`, `uniform float ${size};`)
    uniforms.push(
      { name: pose, values: new Float32Array([x, y, cosine, sine]) },
      { name: size, values: new Float32Array([scale]) }
    )
    c = pose + '.z'
    s = pose + '.w'
    position = pose + '.xy'
    scaleValue = size
  }

  const local = localTransformTemplate({
    cosine: c,
    sine: s,
    position,
    scale: scaleValue,
  })

  return { local, scale: scaleValue }
}

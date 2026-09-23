import { localTransformTemplate } from '@/editor/compiler/templates/localTransform.ts'
import { selectedCutterTemplate } from '@/editor/compiler/templates/selectedCutter.ts'
import type { SceneUniform } from '@/editor/compiler/types.ts'
import type { SceneRoot } from '@/editor/nodes.ts'
import { findNodeTransform, identityTransform } from '@/editor/transforms.ts'

export interface Cutter {
  id: string
  index: number
  distance: string
}

export function compileSelection(
  scene: SceneRoot,
  selectedId: string | undefined,
  cutters: readonly Cutter[],
  declarations: string[],
  uniforms: SceneUniform[]
): string {
  const cutter = cutters.find(({ id }) => id === selectedId)
  const parent = cutter
    ? findNodeTransform(scene, cutter.id)!.parent
    : identityTransform
  const angle = ((parent.rotation % 360) * Math.PI) / 180

  declarations.push(
    'uniform float sdf_cutterIndex;',
    'uniform vec4 sdf_cutterParentPose;',
    'uniform float sdf_cutterParentScale;'
  )
  uniforms.push(
    {
      name: 'sdf_cutterIndex',
      values: new Float32Array([cutter?.index ?? -1]),
    },
    {
      name: 'sdf_cutterParentPose',
      values: new Float32Array([
        parent.x,
        parent.y,
        Math.cos(angle),
        Math.sin(angle),
      ]),
    },
    { name: 'sdf_cutterParentScale', values: new Float32Array([parent.scale]) }
  )

  const local = localTransformTemplate({
    cosine: 'sdf_cutterParentPose.z',
    sine: 'sdf_cutterParentPose.w',
    position: 'sdf_cutterParentPose.xy',
    scale: 'sdf_cutterParentScale',
  })

  return selectedCutterTemplate(local, cutters)
}

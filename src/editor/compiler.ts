import { compile } from '@/editor/compiler/compile.ts'
import type { CompiledScene } from '@/editor/compiler/types.ts'
import type { SceneRoot } from '@/editor/nodes.ts'

export type { CompiledScene, SceneUniform } from '@/editor/compiler/types.ts'

// Exported code contains literals; the preview binds transforms and appearance.
export function compileScene(scene: SceneRoot): CompiledScene {
  return compile(scene, false)
}

export function compilePreviewScene(
  scene: SceneRoot,
  selectedId?: string
): CompiledScene {
  return compile(scene, true, selectedId)
}

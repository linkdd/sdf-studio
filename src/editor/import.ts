import type { SceneRoot } from '@/editor/nodes.ts'
import { DEFAULT_SCENE_NAME } from '@/editor/storage.ts'
import { isRecord, parseScene } from '@/editor/validation.ts'

export function parseSceneJson(raw: string): {
  name: string
  scene: SceneRoot
} {
  let value: unknown

  try {
    value = JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch {
    throw new Error('The file is not valid JSON.')
  }

  if (!isRecord(value)) {
    throw new Error('Expected a JSON scene exported by SDF Studio.')
  }

  if (value.version !== 1) {
    throw new Error(
      'Unsupported scene format. Import a version 1 JSON scene export.'
    )
  }

  if (typeof value.name !== 'string') {
    throw new Error('The scene name must be a string.')
  }

  try {
    return {
      name: value.name.trim() || DEFAULT_SCENE_NAME,
      scene: parseScene(value.scene),
    }
  } catch (cause) {
    if (cause instanceof RangeError) {
      throw new Error('The scene tree is too deeply nested.')
    }

    throw cause
  }
}

import { canHaveChildren } from '@/editor/nodes.ts'
import type { SceneRoot } from '@/editor/nodes.ts'
import { createScene, findNode } from '@/editor/tree.ts'
import { isRecord, parseScene } from '@/editor/validation.ts'

export const STORAGE_KEY = 'sdf-studio.editor.v2'
export const DEFAULT_SCENE_NAME = 'Untitled scene'

export interface SavedEditorState {
  version: 2
  name: string
  scene: SceneRoot
  tab: 'visualization' | 'code'
  selectedId: string
  editingId: string | null
  collapsedIds: string[]
}

function defaultState(): SavedEditorState {
  return {
    version: 2,
    name: DEFAULT_SCENE_NAME,
    scene: createScene(),
    tab: 'visualization',
    selectedId: 'scene',
    editingId: null,
    collapsedIds: [],
  }
}

// Validate saved data before using it as React state; localStorage may be stale or edited.
export function parseEditorState(raw: string): SavedEditorState | null {
  try {
    const value: unknown = JSON.parse(raw)

    if (
      !isRecord(value) ||
      value.version !== 2 ||
      typeof value.name !== 'string'
    ) {
      return null
    }

    const scene = parseScene(value.scene)
    const collapsedIds = Array.isArray(value.collapsedIds)
      ? value.collapsedIds
          .filter((id): id is string => typeof id === 'string')
          .filter((id) => {
            const node = findNode(scene, id)

            return node && canHaveChildren(node)
          })
      : []

    return {
      version: 2,
      name: value.name.trim() || DEFAULT_SCENE_NAME,
      scene,
      tab: value.tab === 'code' ? 'code' : 'visualization',
      selectedId:
        typeof value.selectedId === 'string' &&
        findNode(scene, value.selectedId)
          ? value.selectedId
          : 'scene',
      editingId:
        typeof value.editingId === 'string' &&
        value.editingId !== 'scene' &&
        findNode(scene, value.editingId)
          ? value.editingId
          : null,
      collapsedIds,
    }
  } catch {
    return null
  }
}

export function loadEditorState(
  storage?: Pick<Storage, 'getItem'>
): SavedEditorState {
  try {
    const source = storage ?? window.localStorage
    const raw = source.getItem(STORAGE_KEY)

    return (raw && parseEditorState(raw)) || defaultState()
  } catch {
    return defaultState()
  }
}

export function saveEditorState(
  state: SavedEditorState,
  storage?: Pick<Storage, 'setItem'>
): boolean {
  try {
    ;(storage ?? window.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    )

    return true
  } catch {
    return false
  }
}

export function nextAvailableNodeId(scene: SceneRoot, start: number): number {
  let id = start

  while (findNode(scene, String(id))) {
    id += 1
  }

  return id
}

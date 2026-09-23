import { canHaveChildren } from '@/editor/nodes.ts'
import type { SceneBranch, SceneNode, SceneRoot } from '@/editor/nodes.ts'
import { addNode, createScene, findNode, findParent } from '@/editor/tree.ts'
import { isRecord, parseScene } from '@/editor/validation.ts'

export const NODE_CLIPBOARD_TYPE = 'application/x-sdf-studio-node+json'

export function serializeNode(node: SceneNode): string {
  return JSON.stringify({ type: 'sdf-studio/node', version: 1, node })
}

export function parseNodeClipboard(text: string): SceneNode | null {
  let value: unknown

  try {
    value = JSON.parse(text)
  } catch {
    return null
  }

  if (!isRecord(value) || value.type !== 'sdf-studio/node') {
    return null
  }

  if (value.version !== 1) {
    throw new Error('Unsupported node clipboard version.')
  }

  return parseScene({ ...createScene(), children: [value.node] }).children[0]
}

export function pasteNode(
  root: SceneRoot,
  selectedId: string,
  source: SceneNode
) {
  const selected = findNode(root, selectedId) ?? root
  const parent = canHaveChildren(selected)
    ? selected
    : findParent(root, selected.id)!
  const index = parent.children.findIndex((child) => child.id === selected.id)
  const beforeId = canHaveChildren(selected)
    ? undefined
    : parent.children[index + 1]?.id
  const ids = new Set<string>()

  function reserve(branch: SceneBranch) {
    ids.add(branch.id)
    branch.children.forEach(reserve)
  }

  reserve(root)
  reserve(source)

  let nextId = 1

  function clone(node: SceneNode): SceneNode {
    while (ids.has(String(nextId))) {
      nextId++
    }

    const id = String(nextId++)

    return { ...node, id, children: node.children.map(clone) } as SceneNode
  }

  const node = clone(structuredClone(source))

  return {
    scene: addNode(root, parent.id, node, beforeId),
    id: node.id,
    parentId: parent.id,
  }
}

import { updateGeometry } from '@/editor/geometry.ts'
import type {
  NodeProperties,
  SceneBranch,
  SceneNode,
  SceneRoot,
} from '@/editor/nodes'
import { canHaveChildren } from '@/editor/nodes.ts'
import { isPolygonVertices } from '@/editor/polygon.ts'

export function createScene(): SceneRoot {
  return { id: 'scene', kind: 'root', name: 'Scene', children: [] }
}

export function findNode(
  branch: SceneBranch,
  id: string
): SceneBranch | undefined {
  if (branch.id === id) {
    return branch
  }

  for (const child of branch.children) {
    const found = findNode(child, id)

    if (found) {
      return found
    }
  }
}

export function findParent(
  branch: SceneBranch,
  id: string
): SceneBranch | undefined {
  if (branch.children.some((child) => child.id === id)) {
    return branch
  }

  for (const child of branch.children) {
    const parent = findParent(child, id)

    if (parent) {
      return parent
    }
  }
}

export function countNodes(branch: SceneBranch): number {
  return branch.children.reduce(
    (total, child) => total + 1 + countNodes(child),
    0
  )
}

function appendChild<T extends SceneBranch>(
  branch: T,
  parentId: string,
  node: SceneNode,
  beforeId?: string
): T {
  if (!canHaveChildren(branch)) {
    return branch
  }

  if (branch.id === parentId) {
    const children = [...branch.children]
    const index = beforeId
      ? children.findIndex((child) => child.id === beforeId)
      : children.length

    children.splice(index, 0, node)

    return { ...branch, children }
  }

  return {
    ...branch,
    children: branch.children.map((child) =>
      appendChild(child, parentId, node, beforeId)
    ),
  }
}

export function addNode(
  root: SceneRoot,
  parentId: string,
  node: SceneNode,
  beforeId?: string
): SceneRoot {
  const parent = findNode(root, parentId)

  if (!parent || !canHaveChildren(parent) || findNode(root, node.id)) {
    return root
  }

  if (beforeId && !parent.children.some((child) => child.id === beforeId)) {
    return root
  }

  return appendChild(root, parentId, node, beforeId)
}

function withoutNode<T extends SceneBranch>(branch: T, id: string): T {
  if (!canHaveChildren(branch)) {
    return branch
  }

  return {
    ...branch,
    children: branch.children
      .filter((child) => child.id !== id)
      .map((child) => withoutNode(child, id)),
  }
}

export function removeNode(root: SceneRoot, id: string): SceneRoot {
  // The root itself can never be removed or replaced by a descendant.
  if (id === root.id || !findNode(root, id)) {
    return root
  }

  return withoutNode(root, id)
}

export function canMoveNode(
  root: SceneRoot,
  id: string,
  parentId: string
): boolean {
  const node = findNode(root, id)
  const parent = findNode(root, parentId)

  return (
    !!node &&
    node.kind !== 'root' &&
    !!parent &&
    canHaveChildren(parent) &&
    !findNode(node, parentId)
  )
}

export function moveNode(
  root: SceneRoot,
  id: string,
  parentId: string,
  beforeId?: string
): SceneRoot {
  if (!canMoveNode(root, id, parentId)) {
    return root
  }

  const node = findNode(root, id)

  if (!node || node.kind === 'root') {
    return root
  }

  const parent = findNode(root, parentId)!

  if (beforeId && !parent.children.some((child) => child.id === beforeId)) {
    return root
  }

  const index = parent.children.findIndex((child) => child.id === id)

  if (
    index >= 0 &&
    (beforeId === id || parent.children[index + 1]?.id === beforeId)
  ) {
    return root
  }

  // Move the original branch as a whole, preserving all its descendants.
  return appendChild(withoutNode(root, id), parentId, node, beforeId)
}

export function updateNodeProperties(
  root: SceneRoot,
  id: string,
  properties: Partial<NodeProperties>
): SceneRoot {
  if (id === root.id || !findNode(root, id)) {
    return root
  }

  function update(node: SceneNode): SceneNode {
    if (node.id === id) {
      return {
        ...node,
        name: properties.name ?? node.name,
        transform: properties.transform ?? node.transform,
        ...('style' in node ? { style: properties.style ?? node.style } : {}),
        ...('blend' in node ? { blend: properties.blend ?? node.blend } : {}),
        ...(node.kind === 'polygon'
          ? {
              vertices: isPolygonVertices(properties.vertices)
                ? properties.vertices
                : node.vertices,
            }
          : {}),
        ...updateGeometry(node, properties),
      }
    }

    return canHaveChildren(node)
      ? { ...node, children: node.children.map(update) }
      : node
  }

  return { ...root, children: root.children.map(update) }
}

export function reorderChild(
  root: SceneRoot,
  parentId: string,
  childId: string,
  direction: -1 | 1
): SceneRoot {
  function reorder<T extends SceneBranch>(branch: T): T {
    if (!canHaveChildren(branch)) {
      return branch
    }

    if (branch.id !== parentId) {
      return { ...branch, children: branch.children.map(reorder) }
    }

    const index = branch.children.findIndex((child) => child.id === childId)
    const target = index + direction

    if (index < 0 || target < 0 || target >= branch.children.length) {
      return branch
    }

    const children = [...branch.children]

    ;[children[index], children[target]] = [children[target], children[index]]

    return { ...branch, children }
  }

  return reorder(root)
}

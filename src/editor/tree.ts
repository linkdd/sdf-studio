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

export function countNodes(branch: SceneBranch): number {
  return branch.children.reduce(
    (total, child) => total + 1 + countNodes(child),
    0
  )
}

function appendChild<T extends SceneBranch>(
  branch: T,
  parentId: string,
  node: SceneNode
): T {
  if (!canHaveChildren(branch)) {
    return branch
  }

  if (branch.id === parentId) {
    return { ...branch, children: [...branch.children, node] }
  }

  return {
    ...branch,
    children: branch.children.map((child) =>
      appendChild(child, parentId, node)
    ),
  }
}

export function addNode(
  root: SceneRoot,
  parentId: string,
  node: SceneNode
): SceneRoot {
  const parent = findNode(root, parentId)

  if (!parent || !canHaveChildren(parent) || findNode(root, node.id)) {
    return root
  }

  return appendChild(root, parentId, node)
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
  parentId: string
): SceneRoot {
  if (!canMoveNode(root, id, parentId)) {
    return root
  }

  const node = findNode(root, id)

  if (!node || node.kind === 'root') {
    return root
  }

  // Move the original branch as a whole, preserving all its descendants.
  return appendChild(withoutNode(root, id), parentId, node)
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

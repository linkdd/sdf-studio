import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createNode } from '@/editor/nodes.ts'
import {
  addNode,
  canMoveNode,
  countNodes,
  createScene,
  findNode,
  moveNode,
  removeNode,
  reorderChild,
  updateNodeProperties,
} from '@/editor/tree.ts'

test('rectangle dimensions update independently without changing transforms or other nodes', () => {
  for (const kind of ['box', 'rounded-box']) {
    const rectangle = createNode(kind, 'rect')
    const circle = createNode('circle', 'circle')
    const root = { ...createScene(), children: [rectangle, circle] }
    const next = updateNodeProperties(root, 'rect', { width: 3, height: 0.2 })

    assert.equal(next.children[0].width, 3)
    assert.equal(next.children[0].height, 0.2)
    assert.equal(next.children[0].transform, rectangle.transform)
    assert.equal(next.children[0].style, rectangle.style)
    assert.equal(rectangle.width, 1.6)
    assert.equal(next.children[1], circle)
    assert.equal(
      'width' in updateNodeProperties(root, 'circle', { width: 3 }).children[1],
      false
    )

    for (const width of [0, -1, NaN, Infinity, 1e-7, 1e31]) {
      assert.equal(
        updateNodeProperties(next, 'rect', { width }).children[0].width,
        3
      )
    }

    const resized = updateNodeProperties(next, 'rect', { height: 4 })

    assert.equal(resized.children[0].width, 3)
    assert.equal(resized.children[0].height, 4)
  }
})

const group = (id, children = []) => ({
  ...createNode('group', id, id),
  children,
})
const shape = (id) => createNode('circle', id, id)

test('only roots, groups, and operations accept children', () => {
  const root = addNode(
    addNode(createScene(), 'scene', group('parent')),
    'scene',
    shape('leaf')
  )
  const next = addNode(root, 'parent', shape('child'))

  assert.equal(countNodes(next), 3)
  assert.equal(findNode(root, 'parent').children.length, 0)
  assert.equal(addNode(next, 'leaf', shape('invalid')), next)
  assert.equal(canMoveNode(next, 'child', 'leaf'), false)

  const operation = addNode(next, 'scene', createNode('union', 'op'))

  assert.equal(canMoveNode(operation, 'child', 'op'), true)
})

test('moving a branch preserves every descendant and leaves no duplicate', () => {
  const branch = group('parent', [group('child', [shape('grandchild')])])
  const root = addNode(
    addNode(createScene(), 'scene', branch),
    'scene',
    group('destination')
  )
  const moved = moveNode(root, 'parent', 'destination')

  assert.deepEqual(
    moved.children.map((child) => child.id),
    ['destination']
  )
  assert.equal(findNode(moved, 'destination').children[0], branch)
  assert.equal(countNodes(moved), 4)
  assert.equal(root.children.length, 2)

  const restored = moveNode(moved, 'parent', 'scene')

  assert.equal(findNode(restored, 'destination').children.length, 0)
  assert.equal(findNode(restored, 'parent'), branch)
})

test('root, self, descendant, and missing-target moves are rejected', () => {
  const root = addNode(
    createScene(),
    'scene',
    group('parent', [group('child')])
  )

  for (const [id, target] of [
    ['scene', 'parent'],
    ['parent', 'parent'],
    ['parent', 'child'],
    ['parent', 'missing'],
    ['missing', 'scene'],
  ]) {
    assert.equal(canMoveNode(root, id, target), false)
    assert.equal(moveNode(root, id, target), root)
  }

  assert.equal(removeNode(root, 'scene'), root)
  assert.equal(updateNodeProperties(root, 'scene', { name: 'Changed' }), root)
})

test('removing a parent removes only its subtree', () => {
  const root = addNode(
    addNode(createScene(), 'scene', group('parent', [shape('child')])),
    'scene',
    shape('sibling')
  )
  const next = removeNode(root, 'parent')

  assert.equal(findNode(next, 'child'), undefined)
  assert.equal(findNode(next, 'parent'), undefined)
  assert.deepEqual(
    next.children.map((child) => child.id),
    ['sibling']
  )
  assert.equal(countNodes(root), 3)
})

test('invalid additions do not lose nodes or duplicate existing IDs', () => {
  const root = addNode(createScene(), 'scene', shape('existing'))

  assert.equal(addNode(root, 'missing', shape('new')), root)
  assert.equal(addNode(root, 'scene', shape('existing')), root)
})

test('operations have no style and cannot gain one through property updates', () => {
  for (const kind of ['union', 'subtract', 'intersect']) {
    const child = shape('child')
    const operation = { ...createNode(kind, 'op'), children: [child] }

    assert.equal('style' in operation, false)

    const root = addNode(createScene(), 'scene', operation)
    const next = updateNodeProperties(root, 'op', {
      name: 'Combined',
      style: child.style,
    })

    assert.equal('style' in findNode(next, 'op'), false)
    assert.equal(findNode(next, 'op').name, 'Combined')
    assert.equal(findNode(next, 'child'), child)
  }
})

test('group transforms preserve child local properties and groups cannot gain a style', () => {
  const root = addNode(
    createScene(),
    'scene',
    group('parent', [shape('child')])
  )
  const transform = { x: 2, y: 3, rotation: 45, scale: 2 }
  const next = updateNodeProperties(root, 'parent', {
    transform,
    style: shape('example').style,
  })

  assert.deepEqual(findNode(next, 'parent').transform, transform)
  assert.equal(findNode(next, 'child'), findNode(root, 'child'))
  assert.equal('style' in findNode(next, 'parent'), false)
})

test('reordering subtraction operands changes the base without losing descendants or styles', () => {
  const operand = group('group', [shape('inside')])
  const root = addNode(createScene(), 'scene', {
    ...createNode('subtract', 'op'),
    children: [shape('base'), operand],
  })
  const next = reorderChild(root, 'op', 'group', -1)

  assert.deepEqual(
    findNode(next, 'op').children.map((node) => node.id),
    ['group', 'base']
  )
  assert.equal(findNode(next, 'op').children[0], operand)
  assert.deepEqual(
    findNode(root, 'op').children.map((node) => node.id),
    ['base', 'group']
  )
  assert.deepEqual(reorderChild(next, 'op', 'group', -1), next)
  assert.deepEqual(reorderChild(next, 'op', 'base', 1), next)
})

test('blending applies only to operation nodes and preserves their operands and appearance', () => {
  for (const kind of ['union', 'subtract', 'intersect']) {
    const operation = {
      ...createNode(kind, 'op'),
      children: [shape('a'), shape('b')],
    }

    assert.equal(operation.blend.transition, 'sharp')

    const root = addNode(createScene(), 'scene', operation)
    const blend = { transition: 'smooth', radius: 0.25 }
    const next = updateNodeProperties(root, 'op', { blend })

    assert.deepEqual(findNode(next, 'op').blend, blend)
    assert.equal(findNode(next, 'op').children, operation.children)
    assert.equal(operation.blend.transition, 'sharp')

    const sharp = updateNodeProperties(next, 'op', {
      blend: { ...blend, transition: 'sharp' },
    })

    assert.equal(findNode(sharp, 'op').blend.radius, 0.25)
  }

  for (const kind of ['group', 'circle']) {
    const root = addNode(createScene(), 'scene', createNode(kind, 'node'))
    const next = updateNodeProperties(root, 'node', {
      blend: { transition: 'smooth', radius: 0.2 },
    })

    assert.equal('blend' in findNode(next, 'node'), false)
  }
})

test('polygon edits update only the selected polygon and reject invalid vertex lists', () => {
  const polygon = createNode('polygon', 'poly')
  const root = addNode(
    addNode(createScene(), 'scene', polygon),
    'scene',
    shape('circle')
  )
  const vertices = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ]
  const next = updateNodeProperties(root, 'poly', { vertices })

  assert.deepEqual(findNode(next, 'poly').vertices, vertices)
  assert.equal(findNode(root, 'poly').vertices.length, 5)
  assert.equal(findNode(next, 'poly').style, polygon.style)
  assert.equal(findNode(next, 'poly').transform, polygon.transform)
  assert.equal(
    findNode(updateNodeProperties(next, 'poly', { vertices: [] }), 'poly')
      .vertices,
    vertices
  )
  assert.equal(
    'vertices' in
      findNode(updateNodeProperties(root, 'circle', { vertices }), 'circle'),
    false
  )
})

test('inserting and moving siblings honors positions in either direction', () => {
  const root = {
    ...createScene(),
    children: [shape('a'), shape('b'), shape('c')],
  }
  const ids = (scene) => scene.children.map((node) => node.id)

  assert.deepEqual(ids(moveNode(root, 'c', 'scene', 'a')), ['c', 'a', 'b'])
  assert.deepEqual(ids(moveNode(root, 'a', 'scene', 'c')), ['b', 'a', 'c'])
  assert.deepEqual(ids(moveNode(root, 'a', 'scene')), ['b', 'c', 'a'])
  assert.deepEqual(ids(addNode(root, 'scene', shape('new'), 'b')), [
    'a',
    'new',
    'b',
    'c',
  ])
  assert.equal(moveNode(root, 'a', 'scene', 'a'), root)
  assert.equal(moveNode(root, 'a', 'scene', 'b'), root)
  assert.equal(moveNode(root, 'c', 'scene'), root)
  assert.equal(moveNode(root, 'a', 'scene', 'missing'), root)
  assert.equal(addNode(root, 'scene', shape('new'), 'missing'), root)
  assert.deepEqual(ids(root), ['a', 'b', 'c'])
})

test('moving between parents inserts a whole subtree at the requested position', () => {
  const branch = group('branch', [shape('leaf')])
  const root = {
    ...createScene(),
    children: [branch, group('target', [shape('first')])],
  }
  const moved = moveNode(root, 'branch', 'target', 'first')

  assert.deepEqual(
    findNode(moved, 'target').children.map((node) => node.id),
    ['branch', 'first']
  )
  assert.equal(findNode(moved, 'branch'), branch)
  assert.equal(countNodes(moved), countNodes(root))
  assert.equal(moveNode(root, 'branch', 'branch', 'leaf'), root)
})

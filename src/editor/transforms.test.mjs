import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createNode } from '@/editor/nodes.ts'
import {
  angleDelta,
  composeTransforms,
  findNodeTransform,
  identityTransform,
  inverseTransformPoint,
  moveTransform,
  scaleTransform,
  screenToWorld,
  transformPoint,
  worldToScreen,
} from '@/editor/transforms.ts'
import { createScene } from '@/editor/tree.ts'

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`)
const transform = (x = 0, y = 0, rotation = 0, scale = 1) => ({
  x,
  y,
  rotation,
  scale,
})

test('nested transforms compose in shader order and invert points', () => {
  const parent = transform(2, 3, 90, 2),
    child = transform(1, 0, 30, 0.5)
  const world = composeTransforms(parent, child)

  close(world.x, 2)
  close(world.y, 5)
  close(world.rotation, 120)
  close(world.scale, 1)

  const p = { x: 0.3, y: -0.9 }
  const a = transformPoint(transformPoint(p, child), parent),
    b = transformPoint(p, world)

  close(a.x, b.x)
  close(a.y, b.y)

  const restored = inverseTransformPoint(b, world)

  close(restored.x, p.x)
  close(restored.y, p.y)

  const root = {
    ...createScene(),
    children: [
      {
        ...createNode('group', '1'),
        transform: parent,
        children: [{ ...createNode('box', '2'), transform: child }],
      },
    ],
  }

  assert.deepEqual(findNodeTransform(root, '2').parent, parent)
  assert.deepEqual(findNodeTransform(root, '2').world, world)
  assert.equal(findNodeTransform(root, 'scene'), null)
  assert.equal(findNodeTransform(root, 'missing'), null)
})

test('screen mapping honors camera pan, zoom, aspect ratio and Y-up', () => {
  const view = { width: 900, height: 600, camera: { x: 2, y: -1, height: 6 } }

  assert.deepEqual(worldToScreen({ x: 2, y: -1 }, view), { x: 450, y: 300 })
  assert.deepEqual(worldToScreen({ x: 3, y: 1 }, view), { x: 550, y: 100 })
  assert.deepEqual(screenToWorld({ x: 550, y: 100 }, view), { x: 3, y: 1 })
})

test('world dragging updates local coordinates under rotated scaled parents', () => {
  const start = transform(1, 2, 35, 0.5),
    parent = transform(3, 4, 90, 2)
  const next = moveTransform(
    start,
    parent,
    { x: 0, y: 0 },
    { x: 2, y: 4 },
    'move',
    false
  )

  close(next.x, 3)
  close(next.y, 1)
  assert.equal(next.rotation, 35)
  assert.equal(next.scale, 0.5)
  close(
    moveTransform(
      start,
      parent,
      { x: 0, y: 0 },
      { x: 2, y: 4 },
      'move-x',
      false
    ).y,
    2
  )
  close(
    moveTransform(
      start,
      parent,
      { x: 0, y: 0 },
      { x: 2, y: 4 },
      'move-y',
      false
    ).x,
    1
  )

  const snapped = moveTransform(
    start,
    identityTransform,
    { x: 0, y: 0 },
    { x: 0.14, y: -0.26 },
    'move',
    true
  )

  close(snapped.x, 1.1)
  close(snapped.y, 1.7)
})

test('scaling uses the initial radial projection and cannot cross zero', () => {
  const start = transform(1, 2, 45, 2),
    center = { x: 3, y: 4 },
    from = { x: 4, y: 5 }

  close(scaleTransform(start, center, from, { x: 5, y: 6 }, false).scale, 4)
  close(scaleTransform(start, center, from, { x: 2, y: 3 }, false).scale, 0.001)
  assert.deepEqual(scaleTransform(start, center, center, center, false), start)
  close(
    scaleTransform(start, center, from, { x: 4.02, y: 5.02 }, true).scale,
    2
  )
})

test('rotation deltas unwrap across the angle branch cut', () => {
  close(
    (angleDelta((179 * Math.PI) / 180, (-179 * Math.PI) / 180) * 180) / Math.PI,
    2
  )
  close(
    (angleDelta((-179 * Math.PI) / 180, (179 * Math.PI) / 180) * 180) / Math.PI,
    -2
  )
})

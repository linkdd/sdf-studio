import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  defaultPolygon,
  fitPolygon,
  fromPolygonCanvas,
  insertVertex,
  isPolygonVertices,
  removeVertex,
  toPolygonCanvas,
} from '@/editor/polygon.ts'

test('insertion preserves vertex order, including the closing edge', () => {
  const vertices = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ]

  assert.deepEqual(insertVertex(vertices, 0), [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ])
  assert.deepEqual(insertVertex(vertices, 2), [...vertices, { x: 0, y: 1 }])
  assert.equal(vertices.length, 3)
})

test('removal enforces the three-vertex minimum', () => {
  const vertices = defaultPolygon()
  const four = removeVertex(vertices, 1)

  assert.equal(four.length, 4)
  assert.equal(four[1], vertices[2])

  const triangle = removeVertex(four, 0)

  assert.equal(removeVertex(triangle, 0), triangle)
  assert.equal(removeVertex(vertices, -1), vertices)
})

test('fitting and coordinate conversion preserve local coordinates with Y up', () => {
  const vertices = [
    { x: -3, y: 2 },
    { x: 2, y: 4 },
    { x: 1, y: -1 },
  ]
  const view = fitPolygon(vertices)

  for (const vertex of vertices) {
    const canvas = toPolygonCanvas(vertex, view)

    assert.ok(canvas.x > 0 && canvas.x < 240 && canvas.y > 0 && canvas.y < 240)

    const restored = fromPolygonCanvas(canvas, view)

    assert.ok(Math.abs(restored.x - vertex.x) < 1e-10)
    assert.ok(Math.abs(restored.y - vertex.y) < 1e-10)
  }

  assert.ok(
    toPolygonCanvas({ x: 0, y: 1 }, view).y <
      toPolygonCanvas({ x: 0, y: 0 }, view).y
  )
  assert.ok(
    fitPolygon([
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ]).size > 0
  )
})

test('polygon storage requires at least three finite coordinate pairs', () => {
  assert.equal(isPolygonVertices(defaultPolygon()), true)

  for (const invalid of [
    [],
    [{ x: 0, y: 0 }],
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: NaN, y: 2 },
    ],
    [null, null, null],
  ]) {
    assert.equal(isPolygonVertices(invalid), false)
  }
})

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compilePreviewScene, compileScene } from '@/editor/compiler.ts'
import { serializeScene } from '@/editor/export.ts'
import { geometryDefinitions } from '@/editor/geometry.ts'
import { parseSceneJson } from '@/editor/import.ts'
import { createNode } from '@/editor/nodes.ts'
import { loadEditorState, parseEditorState } from '@/editor/storage.ts'
import { createScene, updateNodeProperties } from '@/editor/tree.ts'

const customGeometry = {
  circle: { radius: 2.3 },
  box: { width: 4, height: 1 },
  'rounded-box': { width: 3, height: 2, cornerRadius: 0.45 },
  triangle: { width: 4, height: 3 },
  ellipse: { radiusX: 2, radiusY: 0.8 },
  capsule: { startX: 1, startY: -1, endX: 1, endY: 2, radius: 0.4 },
  segment: { startX: -1, startY: 2, endX: 2, endY: -2 },
  star: { points: 7, innerRadius: 0.6, outerRadius: 2 },
  arc: { radius: 2, tubeRadius: 0.2, startAngle: 30, sweepAngle: 90 },
}

for (const [kind, geometry] of Object.entries(customGeometry)) {
  test(`${kind}: all geometry edits survive JSON and local storage, and update both shaders`, () => {
    const node = createNode(kind, 'shape')
    const original = { ...createScene(), children: [node] }
    // Edit one field at a time, as the drawer does.
    let scene = original

    for (const [key, value] of Object.entries(geometry)) {
      const before = scene

      scene = updateNodeProperties(scene, 'shape', { [key]: value })
      assert.equal(scene.children[0][key], value)
      assert.notEqual(compileScene(scene).glsl, compileScene(before).glsl, key)
      assert.notEqual(
        compilePreviewScene(scene).glsl,
        compilePreviewScene(before).glsl,
        key
      )
    }

    assert.equal(scene.children[0].transform, node.transform)
    assert.equal(scene.children[0].style, node.style)
    assert.deepEqual(
      parseSceneJson(serializeScene('Geometry', scene)).scene,
      scene
    )

    const state = { ...loadEditorState({ getItem: () => null }), scene }

    assert.deepEqual(parseEditorState(JSON.stringify(state)), state)
    assert.deepEqual(original.children[0], createNode(kind, 'shape'))
  })
}

test('invalid geometry is rejected on import and compilation and ignored by property updates', () => {
  for (const [kind, fields] of Object.entries(geometryDefinitions)) {
    const node = createNode(kind, 'shape')
    const root = { ...createScene(), children: [node] }

    for (const field of fields) {
      const invalid = [
        undefined,
        null,
        '1',
        NaN,
        Infinity,
        -Infinity,
        field.min - Math.max(1, Math.abs(field.min)),
        field.max * 2,
      ]

      if (field.integer) {
        invalid.push(3.5)
      }

      for (const value of invalid) {
        const scene = { ...root, children: [{ ...node, [field.key]: value }] }

        assert.throws(
          () => parseSceneJson(serializeScene('Invalid', scene)),
          /Invalid/,
          `${kind}.${field.key}=${value}`
        )
        assert.throws(() => compileScene(scene), /Invalid/)
        assert.throws(() => compilePreviewScene(scene), /Invalid/)
        assert.deepEqual(
          updateNodeProperties(root, 'shape', { [field.key]: value }),
          root
        )
      }
    }
  }
})

test('geometry edits only apply to fields belonging to the node', () => {
  for (const kind of ['group', 'union', 'subtract', 'intersect', 'polygon']) {
    const scene = { ...createScene(), children: [createNode(kind, 'node')] }

    assert.deepEqual(
      updateNodeProperties(scene, 'node', customGeometry.arc),
      scene
    )
  }

  const scene = { ...createScene(), children: [createNode('circle', 'node')] }

  assert.deepEqual(
    updateNodeProperties(scene, 'node', { points: 12, width: 2 }),
    scene
  )
})

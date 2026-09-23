import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compileScene } from '@/editor/compiler.ts'
import { serializeScene } from '@/editor/export.ts'
import { parseSceneJson } from '@/editor/import.ts'
import { createNode, nodeDefinitions } from '@/editor/nodes.ts'
import { nextAvailableNodeId } from '@/editor/storage.ts'
import { createScene } from '@/editor/tree.ts'

function sample() {
  const children = nodeDefinitions.map(({ kind }, index) =>
    createNode(kind, String(index + 2))
  )
  const union = children.find((node) => node.kind === 'union')

  union.blend = { transition: 'smooth', radius: 0.3 }
  union.children = [createNode('circle', '100'), createNode('box', '101')]
  union.transform = { x: 2, y: 3, rotation: 45, scale: 2 }
  union.children[1].width = 3.5
  union.children[1].height = 0.15
  children.find((n) => n.kind === 'rounded-box').width = 0.25
  children.find((n) => n.kind === 'rounded-box').height = 2.7
  union.children[0].style.stroke = {
    enabled: true,
    color: '#123456',
    width: 0.2,
  }

  return {
    version: 1,
    name: 'Imported scene',
    scene: {
      ...createScene(),
      children: [{ ...createNode('group', '1'), children }],
    },
  }
}

test('JSON exports round-trip every node type, nested geometry, appearance and blending', () => {
  const { name, scene } = sample()
  const imported = parseSceneJson(serializeScene(name, scene))

  assert.deepEqual(imported, { name, scene })
  assert.equal(compileScene(imported.scene).glsl, compileScene(scene).glsl)
  assert.equal(
    nextAvailableNodeId(imported.scene, 1),
    nodeDefinitions.length + 2
  )
})

test('empty scenes, Unicode names and UTF-8 BOMs can be imported', () => {
  const scene = createScene()

  assert.deepEqual(
    parseSceneJson('\uFEFF' + serializeScene('Étoile 星', scene)),
    { name: 'Étoile 星', scene }
  )
  assert.equal(
    parseSceneJson(serializeScene('   ', scene)).name,
    'Untitled scene'
  )
})

test('malformed files and unsupported versions report errors', () => {
  for (const text of [
    '',
    '{',
    'null',
    '[]',
    '42',
    '{}',
    '{"version":2}',
    '{"version":1,"name":42}',
  ]) {
    assert.throws(() => parseSceneJson(text))
  }
})

test('invalid scene data is rejected before use', () => {
  for (const corrupt of [
    (s) => {
      s.scene.id = 'other'
    },
    (s) => {
      s.scene.name = 'mutable root'
    },
    (s) => {
      s.scene.children[0].id = 'scene'
    },
    (s) => {
      s.scene.children[0].children[0].id = '1'
    },
    (s) => {
      s.scene.children[0].children[0].kind = 'unknown'
    },
    (s) => {
      s.scene.children[0].children[0].children = [createNode('circle', '200')]
    },
    (s) => {
      s.scene.children[0].transform.scale = 0
    },
    (s) => {
      s.scene.children[0].transform.x = null
    },
    (s) => {
      s.scene.children[0].children[0].style.fill.color = 'red'
    },
    (s) => {
      s.scene.children[0].children[0].style.stroke.width = -1
    },
    (s) => {
      s.scene.children[0].children.find(
        (n) => n.kind === 'union'
      ).blend.radius = -1
    },
    (s) => {
      s.scene.children[0].children.find((n) => n.kind === 'polygon').vertices =
        []
    },
  ]) {
    const data = sample()

    corrupt(data)
    assert.throws(() => parseSceneJson(JSON.stringify(data)))
  }
})

test('operation exports and imports contain only geometry properties', () => {
  const { name, scene } = sample()
  const imported = parseSceneJson(serializeScene(name, scene))
  const operation = imported.scene.children[0].children.find(
    (n) => n.kind === 'union'
  )

  assert.deepEqual(
    Object.keys(operation).sort(),
    ['id', 'kind', 'name', 'transform', 'blend', 'children'].sort()
  )
  assert.deepEqual(
    operation.children,
    scene.children[0].children.find((n) => n.kind === 'union').children
  )
})

test('JSON import rejects missing and invalid rectangle dimensions', () => {
  for (const kind of ['box', 'rounded-box']) {
    for (const field of ['width', 'height']) {
      for (const value of [undefined, null, '2', 0, -1, 1e-7, 1e31]) {
        const node = { ...createNode(kind, 'rect'), [field]: value }

        assert.throws(
          () =>
            parseSceneJson(
              serializeScene('Invalid', { ...createScene(), children: [node] })
            ),
          /rectangle dimensions/
        )
      }
    }
  }
})

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createNode } from '@/editor/nodes.ts'
import {
  STORAGE_KEY,
  loadEditorState,
  nextAvailableNodeId,
  parseEditorState,
  saveEditorState,
} from '@/editor/storage.ts'

function memoryStorage() {
  const entries = new Map()

  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  }
}

function sampleState() {
  return {
    ...loadEditorState(memoryStorage()),
    name: 'My scene',
    scene: {
      id: 'scene',
      kind: 'root',
      name: 'Scene',
      children: [
        {
          ...createNode('subtract', '1'),
          children: [createNode('circle', '2'), createNode('box', '3')],
        },
      ],
    },
    tab: 'code',
    selectedId: '2',
    editingId: '2',
    collapsedIds: ['1'],
  }
}

test('local storage round-trips styles, transforms, operations, and editor state', () => {
  const storage = memoryStorage()
  const state = sampleState()

  state.scene.children[0].transform = { x: 1, y: 2, rotation: 30, scale: 2 }
  state.scene.children[0].children[0].style.stroke = {
    enabled: true,
    color: '#ffffff',
    width: 0.3,
  }
  state.scene.children[0].blend = { transition: 'smooth', radius: 0.25 }
  state.scene.children[0].children[1].width = 3.25
  state.scene.children[0].children[1].height = 0.125
  state.scene.children.push({
    ...createNode('rounded-box', '4'),
    width: 0.2,
    height: 4,
  })
  assert.equal(saveEditorState(state, storage), true)
  assert.ok(storage.getItem(STORAGE_KEY))
  assert.deepEqual(loadEditorState(storage), state)
  assert.equal(nextAvailableNodeId(loadEditorState(storage).scene, 1), 5)
})

test('malformed or incompatible scenes are rejected before restoration', () => {
  assert.equal(parseEditorState('{broken'), null)

  for (const corrupt of [
    (state) => {
      state.version = 1
    },
    (state) => {
      state.version = 99
    },
    (state) => {
      state.scene.name = 'Changed root'
    },
    (state) => {
      state.scene.children[0].kind = 'unknown'
    },
    (state) => {
      state.scene.children[0].children[0].id = '1'
    },
    (state) => {
      state.scene.children[0].children[0].style.fill.color = 'invalid'
    },
    (state) => {
      state.scene.children[0].children[0].style.stroke.width = -1
    },
    (state) => {
      state.scene.children[0].transform.scale = 0
    },
    (state) => {
      state.scene.children[0].transform.x = null
    },
    (state) => {
      state.scene.children[0].children = null
    },
    (state) => {
      state.scene.children[0].blend = undefined
    },
    (state) => {
      state.scene.children[0].blend.transition = 'unknown'
    },
    (state) => {
      state.scene.children[0].blend.radius = 0
    },
    (state) => {
      state.scene.children[0].blend.radius = -0.1
    },
    (state) => {
      state.scene.children[0].blend.radius = null
    },
    (state) => {
      state.scene.children[0].children[0].children = [createNode('circle', '4')]
    },
  ]) {
    const state = sampleState()

    corrupt(state)
    assert.equal(parseEditorState(JSON.stringify(state)), null)
  }
})

test('stale UI references are discarded without discarding the scene', () => {
  const state = sampleState()

  state.selectedId = 'missing'
  state.editingId = 'scene'
  state.collapsedIds.push('missing', '2')
  state.name = '   '

  const restored = parseEditorState(JSON.stringify(state))

  assert.equal(restored.selectedId, 'scene')
  assert.equal(restored.editingId, null)
  assert.deepEqual(restored.collapsedIds, ['1'])
  assert.equal(restored.name, 'Untitled scene')
  assert.deepEqual(restored.scene, state.scene)
})

test('unavailable or full storage does not crash the editor', () => {
  const storage = {
    getItem() {
      throw new Error('Storage access denied')
    },
    setItem() {
      throw new Error('Storage quota exceeded')
    },
  }

  assert.equal(loadEditorState(storage).name, 'Untitled scene')
  assert.equal(saveEditorState(sampleState(), storage), false)
})

test('polygon vertices survive reload and malformed coordinates are rejected', () => {
  const storage = memoryStorage()
  const state = sampleState()
  const polygon = {
    ...createNode('polygon', 'poly'),
    vertices: [
      { x: -2, y: 1 },
      { x: 3, y: 1 },
      { x: 0.5, y: -4 },
    ],
  }

  state.scene.children.push(polygon)
  saveEditorState(state, storage)
  assert.deepEqual(loadEditorState(storage), state)

  for (const invalid of [
    undefined,
    [],
    [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: null, y: 2 },
    ],
  ]) {
    polygon.vertices = invalid
    assert.equal(parseEditorState(JSON.stringify(state)), null)
  }
})

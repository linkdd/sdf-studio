import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseNodeClipboard, serializeNode } from '@/editor/clipboard.ts'
import { compilePreviewScene } from '@/editor/compiler.ts'
import { serializeScene } from '@/editor/export.ts'
import { parseSceneJson } from '@/editor/import.ts'
import { createNode } from '@/editor/nodes.ts'
import { loadEditorState, parseEditorState } from '@/editor/storage.ts'
import { createScene, updateNodeProperties } from '@/editor/tree.ts'

test('clipping defaults to the center and only Clip nodes accept edge changes', () => {
  const clip = createNode('clip', '1')
  const circle = createNode('circle', '2')
  const scene = { ...createScene(), children: [clip, circle] }
  assert.equal(clip.clipEdge, 'center')

  for (const clipEdge of ['inner', 'outer', 'center']) {
    const updated = updateNodeProperties(scene, '1', { clipEdge })
    assert.equal(updated.children[0].clipEdge, clipEdge)
    assert.equal(
      updateNodeProperties(updated, '1', { clipEdge: 'invalid' }).children[0]
        .clipEdge,
      clipEdge
    )
    assert.equal(
      'clipEdge' in updateNodeProperties(scene, '2', { clipEdge }).children[1],
      false
    )
  }
})

test('clipping edge survives JSON, persistence and clipboard round trips', () => {
  for (const clipEdge of ['inner', 'outer', 'center']) {
    const clip = { ...createNode('clip', '1'), clipEdge }
    const scene = { ...createScene(), children: [clip] }
    assert.deepEqual(parseSceneJson(serializeScene('Clip', scene)).scene, scene)
    assert.deepEqual(parseNodeClipboard(serializeNode(clip)), clip)
    const state = { ...loadEditorState({ getItem: () => null }), scene }
    assert.deepEqual(parseEditorState(JSON.stringify(state)).scene, scene)
  }
})

test('missing edges use the center while invalid edge values are rejected', () => {
  const clip = createNode('clip', '1')
  delete clip.clipEdge
  const scene = { ...createScene(), children: [clip] }
  assert.equal(
    parseSceneJson(serializeScene('Clip', scene)).scene.children[0].clipEdge,
    'center'
  )
  for (const clipEdge of ['invalid', null, 0, {}]) {
    clip.clipEdge = clipEdge
    assert.throws(
      () => parseSceneJson(serializeScene('Clip', scene)),
      /clipping edge/
    )
  }
})

test('base stroke width and visibility edits keep clipping preview shaders reusable', () => {
  for (const clipEdge of ['inner', 'outer', 'center']) {
    const base = createNode('circle', '2')
    const clip = {
      ...createNode('clip', '1'),
      clipEdge,
      children: [base, createNode('box', '3')],
    }
    const scene = { ...createScene(), children: [clip] }
    const before = compilePreviewScene(scene)
    base.style.stroke = { enabled: true, color: '#ff0000', width: 0.4 }
    const after = compilePreviewScene(scene)
    assert.equal(after.glsl, before.glsl)
    assert.notDeepEqual(after.uniforms, before.uniforms)
  }
})

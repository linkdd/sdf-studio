import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  parseNodeClipboard,
  pasteNode,
  serializeNode,
} from '@/editor/clipboard.ts'
import { createNode, nodeDefinitions } from '@/editor/nodes.ts'
import { createScene, findNode } from '@/editor/tree.ts'

const shape = (id) => createNode('circle', id)
const group = (id, children) => ({ ...createNode('group', id), children })
const ids = (branch) => [branch.id, ...branch.children.flatMap(ids)]

test('clipboard round-trips every node kind and rejects invalid or unrelated data', () => {
  for (const { kind } of nodeDefinitions) {
    const node = createNode(kind, '1')
    assert.deepEqual(parseNodeClipboard(serializeNode(node)), node)
  }
  assert.equal(parseNodeClipboard('plain text'), null)
  assert.equal(parseNodeClipboard('{"unrelated":true}'), null)
  assert.throws(() =>
    parseNodeClipboard('{"type":"sdf-studio/node","version":2}')
  )
  assert.throws(() => parseNodeClipboard(serializeNode(createScene())))
  assert.throws(() =>
    parseNodeClipboard(serializeNode(group('1', [shape('1')])))
  )
})

test('pasting clones a subtree with unique IDs and no shared mutable properties', () => {
  const source = group('1', [group('2', [shape('3')])])
  const root = { ...createScene(), children: [source] }
  const pasted = pasteNode(root, 'scene', source)
  const copy = findNode(pasted.scene, pasted.id)

  assert.equal(pasted.scene.children.length, 2)
  assert.equal(new Set(ids(pasted.scene)).size, ids(pasted.scene).length)
  assert.equal(copy.name, source.name)
  assert.deepEqual(
    copy.children[0].children[0].style,
    source.children[0].children[0].style
  )
  assert.notEqual(
    copy.children[0].children[0].style,
    source.children[0].children[0].style
  )
  assert.deepEqual(ids(source), ['1', '2', '3'])
  assert.deepEqual(ids(root), ['scene', '1', '2', '3'])
})

test('pasting chooses container children or the selected shape’s next sibling', () => {
  const root = {
    ...createScene(),
    children: [group('g', [shape('a'), shape('b')])],
  }
  const inside = pasteNode(root, 'g', shape('source'))
  assert.deepEqual(
    findNode(inside.scene, 'g').children.map((node) => node.id),
    ['a', 'b', inside.id]
  )
  const after = pasteNode(root, 'a', shape('source'))
  assert.deepEqual(
    findNode(after.scene, 'g').children.map((node) => node.id),
    ['a', after.id, 'b']
  )
  const fallback = pasteNode(root, 'missing', shape('source'))
  assert.equal(fallback.parentId, 'scene')
})

test('repeated pastes and copies pasted inside their original never create cycles', () => {
  const source = group('1', [shape('2')])
  const root = { ...createScene(), children: [source] }
  const first = pasteNode(root, '1', source)
  const second = pasteNode(first.scene, first.id, source)
  assert.equal(new Set(ids(second.scene)).size, ids(second.scene).length)
  assert.equal(ids(second.scene).length, 7)
  assert.equal(findNode(second.scene, second.id).children.length, 1)
})

import assert from 'node:assert/strict'
import { test } from 'node:test'

import { createHistory } from '@/editor/history.ts'

const initial = { value: 0, selection: 'a' }
const equal = (a, b) => a.value === b.value
const update = (history, value) =>
  history.update((current) => ({ ...current, value }))

test('undo and redo restore snapshots, including selection', () => {
  const history = createHistory(initial, equal)
  update(history, 1)
  history.update((current) => ({ ...current, selection: 'b' }), false)
  update(history, 2)
  history.undo()
  assert.deepEqual(history.getSnapshot(), { value: 1, selection: 'b' })
  history.undo()
  assert.deepEqual(history.getSnapshot(), initial)
  history.redo()
  history.redo()
  assert.deepEqual(history.getSnapshot(), { value: 2, selection: 'b' })
})

test('one gesture is one undo step, even with many updates', () => {
  const history = createHistory(initial, equal)
  history.begin()
  for (let value = 1; value <= 200; value++) update(history, value)
  history.end()
  history.undo()
  assert.equal(history.getSnapshot().value, 0)
  history.redo()
  assert.equal(history.getSnapshot().value, 200)
})

test('cancelled gestures and selection changes preserve redo', () => {
  const history = createHistory(initial, equal)
  update(history, 1)
  history.undo()
  history.begin()
  update(history, 5)
  update(history, 0)
  history.end()
  history.update((current) => ({ ...current, selection: 'b' }), false)
  history.redo()
  assert.equal(history.getSnapshot().value, 1)
})

test('new edits after undo discard the redo branch', () => {
  const history = createHistory(initial, equal)
  update(history, 1)
  update(history, 2)
  history.undo()
  update(history, 3)
  history.redo()
  assert.equal(history.getSnapshot().value, 3)
  history.undo()
  assert.equal(history.getSnapshot().value, 1)
})

test('history limits snapshots and undo finalizes a pending edit', () => {
  const history = createHistory(initial, equal, 2)
  update(history, 1)
  update(history, 2)
  history.begin()
  update(history, 3)
  history.undo()
  history.undo()
  history.undo()
  assert.equal(history.getSnapshot().value, 1)
})

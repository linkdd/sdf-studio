import { createElement, useLayoutEffect } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { createNode } from '@/editor/nodes.ts'
import { createScene, updateNodeProperties } from '@/editor/tree.ts'
import { useEditorHistory } from '@/editor/useEditorHistory.ts'

export async function runHistoryTests() {
  const host = document.createElement('div')
  host.className = 'editor-app'
  document.body.append(host)
  const root = createRoot(host)
  let editor
  let passed = 0

  function Harness() {
    const current = useEditorHistory({
      name: 'Before',
      scene: { ...createScene(), children: [createNode('circle', '1')] },
      selectedId: '1',
      editingId: '1',
      collapsedIds: [],
    })
    useLayoutEffect(() => {
      editor = current
    })

    return createElement('input')
  }

  function check(condition, message) {
    if (!condition) throw Error(message)
    passed++
  }

  function key(key, target = host, modifiers = {}) {
    const event = new KeyboardEvent('keydown', {
      key,
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
      ...modifiers,
    })
    flushSync(() => target.dispatchEvent(event))
    return event.defaultPrevented
  }

  function change(x) {
    flushSync(() =>
      editor.setScene((scene) =>
        updateNodeProperties(scene, '1', {
          transform: { x, y: 0, rotation: 0, scale: 1 },
        })
      )
    )
  }

  const x = () => editor.scene.children[0].transform.x

  try {
    flushSync(() => root.render(createElement(Harness)))
    change(1)
    check(key('z') && x() === 0, 'Ctrl+Z should restore a scene edit')
    check(key('y') && x() === 1, 'Ctrl+Y should redo a scene edit')
    key('z')
    check(
      key('z', host, { shiftKey: true }) && x() === 1,
      'Ctrl+Shift+Z should redo'
    )
    check(
      key('z', host, { ctrlKey: false, metaKey: true }) && x() === 0,
      'Command+Z should undo'
    )
    key('y')

    host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    change(2)
    change(3)
    host.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }))
    await Promise.resolve()
    key('z')
    check(x() === 1, 'A whole pointer gesture should undo together')
    key('y')
    check(x() === 3, 'Redo should restore the final gesture value')

    check(
      key('z', document.body) && x() === 1,
      'Undo should work after a removed control loses focus'
    )
    key('y', document.body)

    const input = host.querySelector('input')
    check(!key('z', input) && x() === 3, 'Text editing must retain native undo')
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))

    host.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    change(4)
    change(3)
    host.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }))
    await Promise.resolve()
    key('z')
    check(x() === 1, 'Cancelled drags should not consume an undo step')

    flushSync(() => editor.setSceneName('After'))
    key('z')
    check(editor.name === 'Before', 'Scene renames should undo')

    return { passed }
  } finally {
    flushSync(() => root.unmount())
    host.remove()
  }
}

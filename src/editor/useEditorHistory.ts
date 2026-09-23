import { useEffect, useState, useSyncExternalStore } from 'react'
import type { SetStateAction } from 'react'

import { createHistory } from '@/editor/history'
import { isEditorTarget, isTextEditor } from '@/editor/keyboard'
import type { SavedEditorState } from '@/editor/storage'

type Document = Pick<
  SavedEditorState,
  'name' | 'scene' | 'selectedId' | 'editingId' | 'collapsedIds'
>

function equalDocument(left: Document, right: Document) {
  return (
    left.name === right.name &&
    (left.scene === right.scene ||
      JSON.stringify(left.scene) === JSON.stringify(right.scene))
  )
}

export function useEditorHistory(initial: Document) {
  const [history] = useState(() => createHistory(initial, equalDocument))
  const document = useSyncExternalStore(history.subscribe, history.getSnapshot)

  useEffect(() => {
    let pointing = false
    let typing = false

    function pointerDown(event: PointerEvent) {
      if (!isEditorTarget(event.target)) {
        return
      }

      history.end()
      history.begin()
      pointing = true
      typing = isTextEditor(event.target)
    }

    function pointerEnd() {
      pointing = false

      // Let the control flush its last frame or restore a cancelled drag first.
      if (!typing) {
        queueMicrotask(history.end)
      }
    }

    function focusOut() {
      if (!pointing) {
        history.end()
      }
    }

    function keyDown(event: KeyboardEvent) {
      if (!isEditorTarget(event.target) || event.isComposing) {
        return
      }

      if (isTextEditor(event.target)) {
        history.begin()
        return
      }

      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        const key = event.key.toLowerCase()

        if (key === 'z' || key === 'y') {
          event.preventDefault()

          if (key === 'y' || event.shiftKey) {
            history.redo()
          } else {
            history.undo()
          }
        }
      } else if (event.key.startsWith('Arrow')) {
        history.begin()
      }
    }

    function keyUp(event: KeyboardEvent) {
      if (!isTextEditor(event.target) && event.key.startsWith('Arrow')) {
        history.end()
      }
    }

    function blur() {
      pointing = false
      typing = false
      queueMicrotask(history.end)
    }

    window.addEventListener('pointerdown', pointerDown, true)
    window.addEventListener('pointerup', pointerEnd, true)
    window.addEventListener('pointercancel', pointerEnd, true)
    window.addEventListener('focusout', focusOut)
    window.addEventListener('keydown', keyDown, true)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)

    return () => {
      history.end()
      window.removeEventListener('pointerdown', pointerDown, true)
      window.removeEventListener('pointerup', pointerEnd, true)
      window.removeEventListener('pointercancel', pointerEnd, true)
      window.removeEventListener('focusout', focusOut)
      window.removeEventListener('keydown', keyDown, true)
      window.removeEventListener('keyup', keyUp)
      window.removeEventListener('blur', blur)
    }
  }, [history])

  function setter<K extends keyof Document>(key: K, undoable = true) {
    return (value: SetStateAction<Document[K]>) =>
      history.update((current) => {
        const next = typeof value === 'function' ? value(current[key]) : value

        return next === current[key] ? current : { ...current, [key]: next }
      }, undoable)
  }

  return {
    ...document,
    history,
    setScene: setter('scene'),
    setSceneName: setter('name'),
    setSelectedId: setter('selectedId', false),
    setEditingId: setter('editingId', false),
    setCollapsedIds: setter('collapsedIds', false),
  }
}

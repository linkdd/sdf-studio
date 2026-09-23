import { useEffect } from 'react'

import {
  NODE_CLIPBOARD_TYPE,
  parseNodeClipboard,
  serializeNode,
} from '@/editor/clipboard'
import { isEditorTarget, isTextEditor } from '@/editor/keyboard'
import type { SceneNode, SceneRoot } from '@/editor/nodes'
import { findNode } from '@/editor/tree'

interface Options {
  scene: SceneRoot
  selectedId: string
  onCut: (id: string) => void
  onPaste: (node: SceneNode) => void
  onError: (message: string) => void
}

export function useNodeClipboard({
  scene,
  selectedId,
  onCut,
  onPaste,
  onError,
}: Options) {
  useEffect(() => {
    function accepts(event: ClipboardEvent) {
      return (
        !event.defaultPrevented &&
        isEditorTarget(event.target) &&
        !isTextEditor(event.target) &&
        event.clipboardData !== null
      )
    }

    function copy(event: ClipboardEvent) {
      if (!accepts(event)) {
        return
      }

      const node = findNode(scene, selectedId)

      if (!node || node.kind === 'root') {
        return
      }

      try {
        const text = serializeNode(node)

        event.clipboardData!.setData('text/plain', text)
        event.clipboardData!.setData(NODE_CLIPBOARD_TYPE, text)
        event.preventDefault()

        // Only remove the branch once its data has been written to the clipboard.
        if (event.type === 'cut') {
          onCut(node.id)
        }
      } catch {
        onError('Unable to copy this node. The scene is unchanged.')
      }
    }

    function paste(event: ClipboardEvent) {
      if (!accepts(event)) {
        return
      }

      try {
        const text =
          event.clipboardData!.getData(NODE_CLIPBOARD_TYPE) ||
          event.clipboardData!.getData('text/plain')
        const node = parseNodeClipboard(text)

        if (node) {
          event.preventDefault()
          onPaste(node)
        }
      } catch {
        event.preventDefault()
        onError(
          'Unable to paste: the clipboard does not contain a valid SDF Studio node.'
        )
      }
    }

    window.addEventListener('copy', copy)
    window.addEventListener('cut', copy)
    window.addEventListener('paste', paste)

    return () => {
      window.removeEventListener('copy', copy)
      window.removeEventListener('cut', copy)
      window.removeEventListener('paste', paste)
    }
  }, [scene, selectedId, onCut, onPaste, onError])
}

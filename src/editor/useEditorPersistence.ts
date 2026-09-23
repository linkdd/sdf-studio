import { useCallback, useEffect, useRef, useState } from 'react'

import { saveEditorState } from '@/editor/storage'
import type { SavedEditorState } from '@/editor/storage'

export function useEditorPersistence(state: SavedEditorState) {
  const pending = useRef<SavedEditorState | null>(null)
  const [status, setStatus] = useState<'saving' | 'saved' | 'unavailable'>(
    'saving'
  )
  const flush = useCallback(() => {
    if (!pending.current) {
      return
    }

    const success = saveEditorState(pending.current)

    pending.current = null
    setStatus(success ? 'saved' : 'unavailable')
  }, [])

  useEffect(() => {
    pending.current = state
    // oxlint-disable-next-line react/set-state-in-effect -- Report pending synchronization with external storage.
    setStatus('saving')

    const timer = window.setTimeout(flush, 250)

    return () => window.clearTimeout(timer)
  }, [state, flush])

  useEffect(() => {
    function hidden() {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', hidden)

    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', hidden)

      if (pending.current) {
        saveEditorState(pending.current)
      }

      pending.current = null
    }
  }, [flush])

  return status
}

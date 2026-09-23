import { useEffect, useRef } from 'react'

import { StreamLanguage } from '@codemirror/language'
import { shader } from '@codemirror/legacy-modes/mode/clike'
import { EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

import { basicSetup } from 'codemirror'

export function CodeEditor({
  code,
  active,
}: {
  code: string
  active: boolean
}) {
  const container = useRef<HTMLDivElement>(null)
  const editor = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!container.current) {
      return
    }

    const view = new EditorView({
      parent: container.current,
      state: EditorState.create({
        doc: '',
        extensions: [
          basicSetup,
          StreamLanguage.define(shader),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.contentAttributes.of({
            'aria-label': 'Generated GLSL code',
            tabindex: '0',
          }),
          EditorView.theme({
            '&': {
              height: '100%',
              backgroundColor: '#13171c',
              fontSize: '13px',
            },
            '.cm-scroller': {
              overflow: 'auto',
              fontFamily: 'var(--font-mono)',
            },
            '.cm-content': { padding: '20px 0' },
            '.cm-gutters': {
              backgroundColor: '#13171c',
              color: '#687382',
              borderRight: '1px solid #282f38',
            },
            '.cm-line': { paddingLeft: '16px', paddingRight: '24px' },
            '&.cm-focused': { outline: 'none' },
          }),
          oneDark,
        ],
      }),
    })

    editor.current = view

    return () => {
      editor.current = null
      view.destroy()
    }
  }, [])

  useEffect(() => {
    const view = editor.current

    if (active && view && view.state.doc.toString() !== code) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: code },
      })
    }
  }, [code, active])

  return <div className="code-editor" ref={container} />
}

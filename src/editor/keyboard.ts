export function isTextEditor(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    !!target.closest(
      'input, textarea, select, [contenteditable]:not([contenteditable="false"]), .cm-editor'
    )
  )
}

export function isEditorTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    (target === document.body ||
      target === document.documentElement ||
      !!target.closest('.editor-app'))
  )
}

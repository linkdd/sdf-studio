import type { SceneRoot } from '@/editor/nodes.ts'

export function serializeScene(name: string, scene: SceneRoot): string {
  return JSON.stringify({ version: 1, name, scene }, null, 2) + '\n'
}

export function downloadFile(
  name: string,
  extension: 'json' | 'glsl',
  content: string
) {
  const filename =
    name
      .trim()
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-|-$/g, '') || 'scene'
  const blob = new Blob([content], {
    type: extension === 'json' ? 'application/json' : 'text/plain',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `${filename}.${extension}`
  document.body.append(link)
  link.click()
  link.remove()
  // Allow the browser to start the download before revoking its URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

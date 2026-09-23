import { compileScene } from '@/editor/compiler'
import { downloadFile, serializeScene } from '@/editor/export'
import { DEFAULT_SCENE_NAME } from '@/editor/storage'
import type { useSceneEditor } from '@/editor/useSceneEditor'

type Editor = ReturnType<typeof useSceneEditor>

type Props = Pick<
  Editor,
  | 'importInput'
  | 'importing'
  | 'sceneName'
  | 'setSceneName'
  | 'importFile'
  | 'scene'
  | 'compilation'
>

export function EditorHeader({
  importInput,
  importing,
  sceneName,
  setSceneName,
  importFile,
  scene,
  compilation,
}: Props) {
  return (
    <header className="app-header">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          ◈
        </span>
        <h1>
          SDF <span>Studio</span>
        </h1>
        <span className="header-divider" />
        <input
          className="document-name"
          aria-label="Scene name"
          title="Rename scene"
          value={sceneName}
          maxLength={120}
          onChange={(event) => setSceneName(event.target.value)}
          onBlur={() =>
            setSceneName((name) => name.trim() || DEFAULT_SCENE_NAME)
          }
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur()
            }
          }}
        />
      </div>
      <div className="export-actions">
        <input
          ref={importInput}
          type="file"
          accept=".json,application/json"
          hidden
          aria-label="Import scene JSON"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]

            event.currentTarget.value = ''

            if (file) {
              void importFile(file)
            }
          }}
        />
        <button
          className="polygon-action"
          disabled={importing}
          title="Replace the current scene with a JSON export"
          onClick={() => importInput.current?.click()}
        >
          {importing ? 'Importing…' : 'Import JSON'}
        </button>
        <button
          className="polygon-action"
          onClick={() =>
            downloadFile(sceneName, 'json', serializeScene(sceneName, scene))
          }
        >
          Export JSON
        </button>
        <button
          className="polygon-action"
          disabled={!!compilation.error}
          onClick={() =>
            downloadFile(sceneName, 'glsl', compileScene(scene).glsl)
          }
        >
          Export GLSL
        </button>
      </div>
    </header>
  )
}

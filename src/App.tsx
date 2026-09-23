import { reorderChild, updateNodeProperties } from '@/editor/tree'
import { useSceneEditor } from '@/editor/useSceneEditor'

import { CodeEditor } from '@/components/CodeEditor'
import { EditorHeader } from '@/components/EditorHeader'
import { NodePalette } from '@/components/NodePalette'
import { NodePropertiesDrawer } from '@/components/NodePropertiesDrawer'
import { SceneGraph } from '@/components/SceneGraph'
import { SceneViewport } from '@/components/SceneViewport'

import '@/App.css'

function App() {
  const {
    importInput,
    importing,
    importNotice,
    setImportNotice,
    documentRevision,
    sceneName,
    setSceneName,
    tab,
    setTab,
    scene,
    setScene,
    selectedId,
    selectNode,
    collapsedIds,
    dragItem,
    setDragItem,
    editingId,
    editingNode,
    compilation,
    code,
    selection,
    nodeCount,
    persistence,
    importFile,
    toggleBranch,
    removeSceneNode,
    closeProperties,
    changeProperties,
    dropNode,
    navigateTabs,
    visualizationTab,
    codeTab,
  } = useSceneEditor()

  return (
    <div className="editor-app">
      <EditorHeader
        importInput={importInput}
        importing={importing}
        sceneName={sceneName}
        setSceneName={setSceneName}
        importFile={importFile}
        scene={scene}
        compilation={compilation}
      />

      {importNotice && (
        <div
          className={`import-notice${importNotice.error ? ' is-error' : ''}`}
          role={importNotice.error ? 'alert' : 'status'}
        >
          <span>{importNotice.text}</span>
          <button
            className="drawer-close"
            aria-label="Dismiss import message"
            onClick={() => setImportNotice(null)}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      )}

      <main className="workspace">
        <NodePalette
          onDragStart={setDragItem}
          onDragEnd={() => setDragItem(null)}
        />
        <SceneGraph
          root={scene}
          selectedId={selectedId}
          collapsedIds={collapsedIds}
          onToggleBranch={toggleBranch}
          dragItem={dragItem}
          onSelect={selectNode}
          onRemove={removeSceneNode}
          editingId={editingId}
          onEdit={selectNode}
          onDrop={dropNode}
          onDragStart={setDragItem}
          onDragEnd={() => setDragItem(null)}
        />

        <section className="center-panel" aria-label="Scene workspace">
          <div className="workspace-toolbar">
            <div
              className="tabs"
              role="tablist"
              aria-label="Workspace view"
              onKeyDown={navigateTabs}
            >
              <button
                ref={visualizationTab}
                id="visualization-tab"
                role="tab"
                aria-selected={tab === 'visualization'}
                aria-controls="visualization-panel"
                tabIndex={tab === 'visualization' ? 0 : -1}
                onClick={() => setTab('visualization')}
              >
                <span aria-hidden="true">▧</span> Visualization
              </button>
              <button
                ref={codeTab}
                id="code-tab"
                role="tab"
                aria-selected={tab === 'code'}
                aria-controls="code-panel"
                tabIndex={tab === 'code' ? 0 : -1}
                onClick={() => setTab('code')}
              >
                <span aria-hidden="true">{'</>'}</span> Code
              </button>
            </div>
            <span className="workspace-format">
              {tab === 'visualization' ? '2D viewport' : 'GLSL'}
            </span>
          </div>

          <div
            id="visualization-panel"
            className="visualization tab-panel"
            role="tabpanel"
            aria-labelledby="visualization-tab"
            tabIndex={0}
            hidden={tab !== 'visualization'}
          >
            <SceneViewport
              key={documentRevision}
              glsl={compilation.glsl}
              uniforms={compilation.uniforms}
              compileError={compilation.error}
              selection={selection}
              onTransform={(id, transform) =>
                setScene((current) =>
                  updateNodeProperties(current, id, { transform })
                )
              }
            />
          </div>

          <div
            id="code-panel"
            className="code-panel tab-panel"
            role="tabpanel"
            aria-labelledby="code-tab"
            hidden={tab !== 'code'}
          >
            <div className="code-toolbar">
              <span>sdScene.glsl</span>
              <span className="badge">Generated · read only</span>
            </div>
            {compilation.error && (
              <div className="code-error" role="alert">
                {compilation.error}
              </div>
            )}
            <CodeEditor code={code} active={tab === 'code'} />
          </div>

          <footer className="viewport-footer">
            <span>
              {tab === 'visualization'
                ? 'Visualization'
                : 'Generated code preview'}
            </span>
            <span>
              {nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
            </span>
          </footer>
        </section>
      </main>
      <NodePropertiesDrawer
        node={editingNode?.kind !== 'root' ? (editingNode ?? null) : null}
        onChange={changeProperties}
        onClose={closeProperties}
        onReorder={(childId, direction) => {
          if (editingId) {
            setScene((current) =>
              reorderChild(current, editingId, childId, direction)
            )
          }
        }}
      />
      <footer className="app-footer">
        <span>2D signed distance field editor</span>
        <span role="status">
          {persistence === 'saving'
            ? 'Saving…'
            : persistence === 'saved'
              ? 'Saved locally'
              : 'Local save unavailable'}
        </span>
      </footer>
    </div>
  )
}

export default App

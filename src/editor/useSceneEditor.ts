import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'

import { pasteNode } from '@/editor/clipboard'
import { compilePreviewScene, compileScene } from '@/editor/compiler'
import { parseSceneJson } from '@/editor/import'
import { canHaveChildren, createNode } from '@/editor/nodes'
import type { NodeDrag, NodeKind, NodeProperties } from '@/editor/nodes'
import {
  DEFAULT_SCENE_NAME,
  loadEditorState,
  nextAvailableNodeId,
} from '@/editor/storage'
import { findNodeTransform } from '@/editor/transforms'
import {
  addNode,
  countNodes,
  findNode,
  moveNode,
  removeNode,
  updateNodeProperties,
} from '@/editor/tree'
import { useEditorHistory } from '@/editor/useEditorHistory'
import { useEditorPersistence } from '@/editor/useEditorPersistence'
import { useNodeClipboard } from '@/editor/useNodeClipboard'

type Tab = 'visualization' | 'code'

export function useSceneEditor() {
  const importInput = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importNotice, setImportNotice] = useState<{
    error: boolean
    text: string
  } | null>(null)
  const [documentRevision, setDocumentRevision] = useState(0)
  const [initialState] = useState(loadEditorState)
  const {
    name: sceneName,
    scene,
    selectedId,
    editingId,
    collapsedIds,
    setSceneName,
    setScene,
    setSelectedId,
    setEditingId,
    setCollapsedIds,
    history,
  } = useEditorHistory(initialState)
  const [tab, setTab] = useState<Tab>(initialState.tab)
  const [dragItem, setDragItem] = useState<NodeDrag | null>(null)
  const compilation = useMemo(() => {
    try {
      return { ...compilePreviewScene(scene, selectedId), error: null }
    } catch (cause) {
      return {
        glsl: '',
        uniforms: [],
        error:
          cause instanceof Error ? cause.message : 'Scene compilation failed.',
      }
    }
  }, [scene, selectedId])
  const code = useMemo(
    () =>
      tab === 'code' && !compilation.error ? compileScene(scene).glsl : '',
    [scene, tab, compilation.error]
  )
  const selection = useMemo(
    () => findNodeTransform(scene, selectedId),
    [scene, selectedId]
  )
  const editingNode = editingId ? findNode(scene, editingId) : undefined
  const editTrigger = useRef<HTMLButtonElement | null>(null)
  const nodeCount = countNodes(scene)
  const nextId = useRef(1)
  const visualizationTab = useRef<HTMLButtonElement>(null)
  const codeTab = useRef<HTMLButtonElement>(null)

  const persistence = useEditorPersistence(
    useMemo(
      () => ({
        version: 2,
        name: sceneName,
        scene,
        tab,
        selectedId,
        editingId,
        collapsedIds,
      }),
      [sceneName, scene, tab, selectedId, editingId, collapsedIds]
    )
  )

  useNodeClipboard({
    scene,
    selectedId,
    onCut: (id) => {
      history.end()
      history.begin()
      removeSceneNode(id)
      history.end()
    },
    onPaste: (source) => {
      const pasted = pasteNode(scene, selectedId, source)

      history.end()
      history.begin()
      setScene(pasted.scene)
      setSelectedId(pasted.id)
      setEditingId(pasted.id)
      setCollapsedIds((ids) => ids.filter((id) => id !== pasted.parentId))
      history.end()
    },
    onError: (text) => setImportNotice({ error: true, text }),
  })

  useEffect(() => {
    document.title = (sceneName.trim() || DEFAULT_SCENE_NAME) + ' — SDF Studio'
  }, [sceneName])

  async function importFile(file: File) {
    setImporting(true)
    setImportNotice(null)

    try {
      const imported = parseSceneJson(await file.text())

      history.end()
      history.begin()
      setScene(imported.scene)
      setSceneName(imported.name)
      setSelectedId('scene')
      setEditingId(null)
      setCollapsedIds([])
      history.end()
      setDragItem(null)
      setTab('visualization')
      editTrigger.current = null
      nextId.current = 1
      setDocumentRevision((revision) => revision + 1)
      setImportNotice({ error: false, text: `Imported “${imported.name}”.` })
    } catch (cause) {
      setImportNotice({
        error: true,
        text: `Import failed: ${cause instanceof Error ? cause.message : 'Unable to read this file.'} Your current scene is unchanged.`,
      })
    } finally {
      setImporting(false)
    }
  }

  function toggleBranch(id: string) {
    setCollapsedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id]
    )
  }

  function addSceneNode(kind: NodeKind, parentId: string, beforeId?: string) {
    const parent = findNode(scene, parentId)

    if (!parent || !canHaveChildren(parent)) {
      return
    }

    const availableId = nextAvailableNodeId(scene, nextId.current)

    nextId.current = availableId + 1

    const id = String(availableId)

    setScene((current) =>
      addNode(current, parentId, createNode(kind, id), beforeId)
    )
    setSelectedId(id)
  }

  function removeSceneNode(id: string) {
    if (id === scene.id) {
      return
    }

    const branch = findNode(scene, id)

    setScene((current) => removeNode(current, id))

    if (branch && findNode(branch, selectedId)) {
      setSelectedId(scene.id)
    }

    if (branch && editingId && findNode(branch, editingId)) {
      setEditingId(null)
    }

    if (branch) {
      setCollapsedIds((current) =>
        current.filter((entry) => !findNode(branch, entry))
      )
    }
  }

  function selectNode(id: string, trigger: HTMLButtonElement) {
    editTrigger.current = trigger
    setSelectedId(id)
    setEditingId(id === scene.id ? null : id)
  }

  function closeProperties() {
    setEditingId(null)
    editTrigger.current?.focus()
  }

  function changeProperties(properties: Partial<NodeProperties>) {
    if (editingId) {
      setScene((current) =>
        updateNodeProperties(current, editingId, properties)
      )
    }
  }

  function dropNode(parentId: string, beforeId?: string) {
    if (!dragItem) {
      return
    }

    if (dragItem.source === 'library') {
      addSceneNode(dragItem.kind, parentId, beforeId)
    } else {
      setScene((current) => moveNode(current, dragItem.id, parentId, beforeId))
    }

    setDragItem(null)
  }

  function navigateTabs(event: KeyboardEvent<HTMLDivElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return
    }

    event.preventDefault()

    const next =
      event.key === 'Home'
        ? 'visualization'
        : event.key === 'End'
          ? 'code'
          : tab === 'visualization'
            ? 'code'
            : 'visualization'

    setTab(next)

    const target = next === 'visualization' ? visualizationTab : codeTab

    target.current?.focus()
  }

  return {
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
  }
}

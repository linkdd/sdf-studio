import type { NodeDrag, SceneBranch, SceneRoot } from '@/editor/nodes'

export interface SceneGraphProps {
  root: SceneRoot
  selectedId: string
  collapsedIds: readonly string[]
  onToggleBranch: (id: string) => void
  editingId: string | null
  dragItem: NodeDrag | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onEdit: (id: string, trigger: HTMLButtonElement) => void
  onDrop: (parentId: string) => void
  onDragStart: (item: NodeDrag) => void
  onDragEnd: () => void
}

export interface BranchProps extends SceneGraphProps {
  node: SceneBranch
  operand?: 'Base' | 'Cutter'
  dropTarget: string | null
  setDropTarget: (id: string | null) => void
}

import type { NodeProperties, SceneNode } from '@/editor/nodes'

export interface NodePropertiesDrawerProps {
  node: SceneNode | null
  onChange: (properties: Partial<NodeProperties>) => void
  onClose: () => void
  onReorder: (childId: string, direction: -1 | 1) => void
}

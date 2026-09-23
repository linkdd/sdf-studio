import type { Point } from '@/editor/polygon'

export interface PolygonEditorProps {
  vertices: readonly Point[]
  onChange: (vertices: readonly Point[]) => void
}

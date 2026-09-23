import { isClipEdge } from '@/editor/nodes'
import type { ClipNode, NodeProperties } from '@/editor/nodes'

export function ClipFields({
  node,
  onChange,
}: {
  node: ClipNode
  onChange: (properties: Partial<NodeProperties>) => void
}) {
  return (
    <section className="property-section" aria-label="Clipping">
      <h3>Clipping</h3>
      <label className="property-field">
        <span>Clip at</span>
        <select
          value={node.clipEdge}
          onChange={(event) => {
            const clipEdge = event.target.value

            if (isClipEdge(clipEdge)) {
              onChange({ clipEdge })
            }
          }}
        >
          <option value="outer">Outer stroke edge</option>
          <option value="inner">Inner stroke edge</option>
          <option value="center">Stroke center (geometry boundary)</option>
        </select>
      </label>
      <p className="property-hint">
        Choose where content stops relative to the base's stroke. Without a
        stroke, all three options use the geometry boundary.
      </p>
    </section>
  )
}

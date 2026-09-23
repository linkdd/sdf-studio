import type { NodeProperties, SceneNode } from '@/editor/nodes'

import { NumberField } from '@/components/PropertyFields'

export function TransformFields({
  node,
  onChange,
}: {
  node: SceneNode
  onChange: (properties: Partial<NodeProperties>) => void
}) {
  return (
    <section className="property-section" aria-label="Local transform">
      <h3>Transform</h3>
      <div className="property-grid">
        <NumberField
          label="Position X"
          value={node.transform.x}
          onChange={(x) => onChange({ transform: { ...node.transform, x } })}
        />
        <NumberField
          label="Position Y"
          value={node.transform.y}
          onChange={(y) => onChange({ transform: { ...node.transform, y } })}
        />
        <NumberField
          label="Rotation (°)"
          value={node.transform.rotation}
          step={1}
          onChange={(rotation) =>
            onChange({ transform: { ...node.transform, rotation } })
          }
        />
        <NumberField
          label="Scale"
          value={node.transform.scale}
          min={0.001}
          onChange={(scale) =>
            onChange({ transform: { ...node.transform, scale } })
          }
        />
      </div>
      <p className="property-hint">Relative to the parent. Scale is uniform.</p>
    </section>
  )
}

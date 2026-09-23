import type { NodeProperties, OperationNode } from '@/editor/nodes'

import { NumberField } from '@/components/PropertyFields'

export function BlendFields({
  node,
  onChange,
}: {
  node: OperationNode
  onChange: (properties: Partial<NodeProperties>) => void
}) {
  return (
    <section className="property-section" aria-label="Shape blending">
      <h3>Blending</h3>
      <label className="property-field">
        <span>Transition</span>
        <select
          value={node.blend.transition}
          onChange={(event) =>
            onChange({
              blend: {
                ...node.blend,
                transition:
                  event.target.value === 'smooth' ? 'smooth' : 'sharp',
              },
            })
          }
        >
          <option value="sharp">Sharp</option>
          <option value="smooth">Smooth</option>
        </select>
      </label>
      {node.blend.transition === 'smooth' && (
        <NumberField
          label="Smoothing radius"
          value={node.blend.radius}
          min={0.001}
          step={0.01}
          onChange={(radius) => onChange({ blend: { ...node.blend, radius } })}
        />
      )}
      <p className="property-hint">
        {node.blend.transition === 'sharp'
          ? 'Keep sharp junctions between child shapes.'
          : 'Round junctions between child shapes. Radius is measured in local scene units.'}
      </p>
    </section>
  )
}

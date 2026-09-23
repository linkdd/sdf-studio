import { geometryDefinitions, isPrimitiveKind } from '@/editor/geometry'
import type { GeometryProperties } from '@/editor/geometry'
import type { NodeProperties, SceneNode } from '@/editor/nodes'

import { NumberField } from '@/components/PropertyFields'

export function ShapeGeometryFields({
  node,
  onChange,
}: {
  node: SceneNode
  onChange: (properties: Partial<NodeProperties>) => void
}) {
  if (!isPrimitiveKind(node.kind)) {
    return null
  }

  const values = node as SceneNode & GeometryProperties

  return (
    <section className="property-section" aria-label="Shape geometry">
      <h3>Geometry</h3>
      <div className="property-grid">
        {geometryDefinitions[node.kind].map((field) => (
          <NumberField
            key={field.key}
            label={field.label}
            value={values[field.key]!}
            min={field.min}
            max={field.max}
            step={field.step}
            integer={field.integer}
            onChange={(value) => onChange({ [field.key]: value })}
          />
        ))}
      </div>
      <p className="property-hint">
        Dimensions and endpoints use local scene units.
      </p>
      {node.kind === 'rounded-box' && (
        <p className="property-hint">
          Corner radius is capped at half the shorter side.
        </p>
      )}
      {node.kind === 'triangle' && (
        <p className="property-hint">
          Width is the base; height runs from base to tip. The origin stays at
          the centroid.
        </p>
      )}
      {node.kind === 'star' && (
        <p className="property-hint">
          Use 3–64 points. Inner and outer radii alternate around the center.
        </p>
      )}
      {node.kind === 'arc' && (
        <p className="property-hint">
          Angles run counterclockwise from +X. A 360° sweep makes a full ring.
        </p>
      )}
    </section>
  )
}

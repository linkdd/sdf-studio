import { canHaveChildren, nodeColor, nodeDefinitions } from '@/editor/nodes'
import type { SceneNode } from '@/editor/nodes'

import { NodeIcon } from '@/components/NodeIcon'
import { PolygonEditor } from '@/components/PolygonEditor'
import { ShapeGeometryFields } from '@/components/ShapeGeometryFields'
import { AppearanceFields } from '@/components/properties/AppearanceFields'
import { BlendFields } from '@/components/properties/BlendFields'
import { ChildOrderFields } from '@/components/properties/ChildOrderFields'
import { TransformFields } from '@/components/properties/TransformFields'
import type { NodePropertiesDrawerProps } from '@/components/properties/types'

export function NodePropertiesForm({
  node,
  onChange,
  onClose,
  onReorder,
}: NodePropertiesDrawerProps & { node: SceneNode }) {
  const typeName = nodeDefinitions.find(
    (definition) => definition.kind === node.kind
  )!.label
  const style = 'style' in node ? node.style : null

  return (
    <>
      <div className="panel-heading">
        <h2 id="properties-heading">Node properties</h2>
        <button
          className="drawer-close"
          aria-label="Close node properties"
          title="Close (Escape)"
          onClick={onClose}
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="properties-content">
        <div className="properties-type">
          <span className="node-icon-box" style={{ color: nodeColor(node) }}>
            <NodeIcon kind={node.kind} />
          </span>
          <span>{typeName}</span>
        </div>
        <label className="property-field">
          <span>Name</span>
          <input
            type="text"
            value={node.name}
            maxLength={120}
            onChange={(event) => onChange({ name: event.target.value })}
            onBlur={() => onChange({ name: node.name.trim() || typeName })}
          />
        </label>

        {node.kind === 'polygon' && (
          <PolygonEditor
            vertices={node.vertices}
            onChange={(vertices) => onChange({ vertices })}
          />
        )}

        <ShapeGeometryFields node={node} onChange={onChange} />

        {'blend' in node && <BlendFields node={node} onChange={onChange} />}

        <TransformFields node={node} onChange={onChange} />

        {canHaveChildren(node) && (
          <ChildOrderFields node={node} onReorder={onReorder} />
        )}

        {node.kind === 'group' && (
          <p className="property-hint">
            Children keep their own fill and stroke.
          </p>
        )}
        {style && <AppearanceFields style={style} onChange={onChange} />}
      </div>
    </>
  )
}

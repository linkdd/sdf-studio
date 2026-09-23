import { useState } from 'react'

import { nodeDefinitions } from '@/editor/nodes'
import type { NodeDrag } from '@/editor/nodes'

import { NodeIcon } from '@/components/NodeIcon'

interface NodePaletteProps {
  onDragStart: (item: NodeDrag) => void
  onDragEnd: () => void
}

export function NodePalette({ onDragStart, onDragEnd }: NodePaletteProps) {
  const [search, setSearch] = useState('')
  const filteredNodes = nodeDefinitions.filter((node) =>
    (node.label + ' ' + node.description + ' ' + node.category)
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )

  return (
    <aside className="side-panel palette" aria-labelledby="nodes-heading">
      <div className="panel-heading">
        <h2 id="nodes-heading">Node library</h2>
        <span className="count">{nodeDefinitions.length}</span>
      </div>
      <div className="palette-search">
        <input
          type="search"
          aria-label="Search nodes"
          placeholder="Search nodes…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <div className="panel-scroll" tabIndex={0} aria-label="Available nodes">
        {(['Structure', 'Operations', 'Shapes'] as const).map((category) => {
          const nodes = filteredNodes.filter(
            (node) => node.category === category
          )

          if (!nodes.length) {
            return null
          }

          return (
            <section key={category} aria-label={category}>
              <div className="section-label">
                {category}
                <span>{nodes.length}</span>
              </div>
              <ul className="node-list">
                {nodes.map((node) => (
                  <li key={node.kind}>
                    <div
                      className="palette-node"
                      draggable
                      onDragStart={(event) => {
                        const item: NodeDrag = {
                          source: 'library',
                          kind: node.kind,
                        }

                        event.dataTransfer.setData(
                          'application/x-sdf-node',
                          JSON.stringify(item)
                        )
                        event.dataTransfer.effectAllowed = 'copy'
                        onDragStart(item)
                      }}
                      onDragEnd={onDragEnd}
                      title={
                        'Drag ' +
                        node.label.toLowerCase() +
                        ' onto Scene, a group, or an operation'
                      }
                    >
                      <span className="node-icon-box">
                        <NodeIcon kind={node.kind} />
                      </span>
                      <span className="node-description">
                        <strong>{node.label}</strong>
                        <small>{node.description}</small>
                      </span>
                      <span className="drag-handle" aria-hidden="true">
                        ⠿
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
        {filteredNodes.length === 0 && (
          <p className="empty-message">No matching nodes.</p>
        )}
      </div>
      <div className="panel-footer">
        Drag onto Scene, a group, or an operation.
      </div>
    </aside>
  )
}

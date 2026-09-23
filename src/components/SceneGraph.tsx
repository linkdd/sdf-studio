import { useState } from 'react'

import { countNodes } from '@/editor/tree'

import { Branch } from '@/components/scene-graph/Branch'
import type { SceneGraphProps } from '@/components/scene-graph/types'

export function SceneGraph(props: SceneGraphProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  return (
    <aside className="side-panel graph" aria-labelledby="graph-heading">
      <div className="panel-heading">
        <h2 id="graph-heading">Scene graph</h2>
        <span className="count">{countNodes(props.root)}</span>
      </div>
      <div className="graph-toolbar">
        <span>Hierarchy</span>
        <span>Drop onto a parent</span>
      </div>
      <div
        className="panel-scroll graph-scroll"
        tabIndex={0}
        aria-label="Scene nodes"
      >
        <ul className="scene-tree" aria-label="Scene hierarchy">
          <Branch
            {...props}
            node={props.root}
            dropTarget={dropTarget}
            setDropTarget={setDropTarget}
          />
        </ul>
      </div>
    </aside>
  )
}

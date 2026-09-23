import type { DragEvent } from 'react'

import type { NodeDrag } from '@/editor/nodes'
import { canHaveChildren, nodeColor } from '@/editor/nodes'
import { canMoveNode, findParent } from '@/editor/tree'

import { NodeIcon } from '@/components/NodeIcon'
import type { BranchProps } from '@/components/scene-graph/types'

export function Branch(props: BranchProps) {
  const {
    node,
    root,
    selectedId,
    dragItem,
    dropTarget,
    setDropTarget,
    onSelect,
    onRemove,
    onDrop,
    onDragStart,
    onDragEnd,
  } = props
  const expanded = !props.collapsedIds.includes(node.id)
  const isRoot = node.kind === 'root'
  const childrenId = 'children-' + node.id
  const position = dropTarget?.startsWith(node.id + ':')
    ? dropTarget.slice(node.id.length + 1)
    : null

  function dropLocation(event: DragEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const fraction = (event.clientY - bounds.top) / bounds.height
    const inside =
      isRoot || (canHaveChildren(node) && fraction >= 0.25 && fraction <= 0.75)
    const position = inside ? 'inside' : fraction < 0.5 ? 'before' : 'after'
    const parent = inside ? node : findParent(root, node.id)

    if (!dragItem || !parent || !canHaveChildren(parent)) {
      return null
    }

    if (
      dragItem.source === 'scene' &&
      (dragItem.id === node.id || !canMoveNode(root, dragItem.id, parent.id))
    ) {
      return null
    }

    const index = parent.children.findIndex((child) => child.id === node.id)
    const beforeId = inside
      ? undefined
      : position === 'before'
        ? node.id
        : parent.children[index + 1]?.id

    return { parentId: parent.id, beforeId, position }
  }

  function acceptDrag(event: DragEvent<HTMLDivElement>) {
    event.stopPropagation()

    const location = dropLocation(event)

    if (!location) {
      event.dataTransfer.dropEffect = 'none'
      setDropTarget(null)

      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect =
      dragItem?.source === 'library' ? 'copy' : 'move'
    setDropTarget(node.id + ':' + location.position)
  }

  return (
    <li className="scene-branch">
      <div
        className={
          'graph-row' +
          (isRoot ? ' scene-root' : '') +
          (selectedId === node.id ? ' selected' : '') +
          (position === 'inside'
            ? ' drop-target'
            : position
              ? ' drop-' + position
              : '')
        }
        data-node-id={node.id}
        onDragEnter={acceptDrag}
        onDragOver={acceptDrag}
        onDragLeave={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null)
          ) {
            setDropTarget(null)
          }
        }}
        onDrop={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setDropTarget(null)

          const location = dropLocation(event)

          if (!location) {
            return
          }

          if (location.position === 'inside' && !expanded) {
            props.onToggleBranch(node.id)
          }

          onDrop(location.parentId, location.beforeId)
        }}
      >
        {canHaveChildren(node) ? (
          <button
            className="disclosure"
            aria-label={(expanded ? 'Collapse ' : 'Expand ') + node.name}
            aria-expanded={expanded}
            aria-controls={childrenId}
            onClick={() => props.onToggleBranch(node.id)}
          >
            <svg
              className="disclosure-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 4 4 4-4 4" />
            </svg>
          </button>
        ) : (
          <span className="disclosure-spacer" />
        )}
        <button
          className="graph-node"
          draggable={!isRoot}
          aria-pressed={selectedId === node.id}
          onClick={(event) => onSelect(node.id, event.currentTarget)}
          onDragStart={(event) => {
            if (isRoot) {
              event.preventDefault()

              return
            }

            event.stopPropagation()

            const item: NodeDrag = { source: 'scene', id: node.id }

            event.dataTransfer.setData(
              'application/x-sdf-node',
              JSON.stringify(item)
            )
            event.dataTransfer.effectAllowed = 'move'
            setDropTarget(null)
            onDragStart(item)
          }}
          onDragEnd={() => {
            setDropTarget(null)
            onDragEnd()
          }}
          title={
            isRoot
              ? 'Scene root · cannot be moved or removed'
              : canHaveChildren(node)
                ? 'Drag to move this node and its children'
                : 'Drag to move this shape. Shapes cannot contain children.'
          }
        >
          {isRoot ? (
            <span className="root-icon" aria-hidden="true">
              ◇
            </span>
          ) : (
            <span
              className="graph-node-symbol"
              style={{ color: nodeColor(node) }}
            >
              <NodeIcon kind={node.kind} />
            </span>
          )}
          <span className="graph-node-name">{node.name}</span>
          {props.operand && (
            <span className="operand-tag">{props.operand}</span>
          )}
        </button>
        {isRoot ? (
          <span className="root-tag">Root</span>
        ) : (
          <>
            <button
              className="node-edit"
              aria-label={'Edit ' + node.name}
              aria-expanded={props.editingId === node.id}
              aria-controls={
                props.editingId === node.id ? 'node-properties' : undefined
              }
              title="Edit node properties"
              onClick={(event) => props.onEdit(node.id, event.currentTarget)}
            >
              <svg
                className="node-edit-icon"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m10 3 3 3M3 10l7-7a2.12 2.12 0 0 1 3 3l-7 7-4 1Z" />
              </svg>
            </button>
            <button
              className="node-remove"
              aria-label={'Remove ' + node.name + ' and its children'}
              title="Remove node and its children"
              onClick={() => onRemove(node.id)}
            >
              <svg
                className="node-remove-icon"
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
          </>
        )}
      </div>
      <ul id={childrenId} className="scene-children" hidden={!expanded}>
        {node.children.map((child, index) => (
          <Branch
            key={child.id}
            {...props}
            node={child}
            operand={
              node.kind === 'subtract' || node.kind === 'clip'
                ? index === 0
                  ? 'Base'
                  : node.kind === 'clip'
                    ? 'Content'
                    : 'Cutter'
                : undefined
            }
          />
        ))}
      </ul>
    </li>
  )
}

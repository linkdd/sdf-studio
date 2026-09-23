import { isOperation } from '@/editor/nodes'
import type { ClipNode, GroupNode, OperationNode } from '@/editor/nodes'

export function ChildOrderFields({
  node,
  onReorder,
}: {
  node: GroupNode | ClipNode | OperationNode
  onReorder: (childId: string, direction: -1 | 1) => void
}) {
  return (
    <section className="property-section" aria-label="Children">
      <h3>{isOperation(node.kind) ? 'Operands' : 'Children'}</h3>
      {node.kind === 'subtract' && (
        <p className="property-hint">
          The first child is the base. All following children cut into it.
        </p>
      )}
      {node.kind === 'clip' && (
        <p className="property-hint">
          The first child stays visible. The others are drawn inside it, each
          keeping its own fill and stroke.
        </p>
      )}
      {isOperation(node.kind) && node.children.length < 2 && (
        <p className="property-hint">
          Add at least two children to combine shapes.
        </p>
      )}
      <ol className="operand-list">
        {node.children.map((child, index) => (
          <li key={child.id}>
            <span className="operand-name">{child.name}</span>
            {(node.kind === 'subtract' || node.kind === 'clip') && (
              <span className="operand-tag">
                {index === 0
                  ? 'Base'
                  : node.kind === 'clip'
                    ? 'Content'
                    : 'Cutter'}
              </span>
            )}
            <button
              className="operand-move"
              disabled={index === 0}
              aria-label={'Move ' + child.name + ' up'}
              onClick={() => onReorder(child.id, -1)}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 13V3m-4 4 4-4 4 4" />
              </svg>
            </button>
            <button
              className="operand-move"
              disabled={index === node.children.length - 1}
              aria-label={'Move ' + child.name + ' down'}
              onClick={() => onReorder(child.id, 1)}
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M8 3v10m-4-4 4 4 4-4" />
              </svg>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

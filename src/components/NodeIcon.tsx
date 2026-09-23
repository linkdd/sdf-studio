import { nodeDefinitions } from '@/editor/nodes'
import type { NodeKind } from '@/editor/nodes'

export function NodeIcon({ kind }: { kind: NodeKind }) {
  return (
    <svg
      className="node-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={nodeDefinitions.find((node) => node.kind === kind)?.path} />
    </svg>
  )
}

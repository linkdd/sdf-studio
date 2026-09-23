import { useEffect, useRef, useState } from 'react'

import { NodePropertiesForm } from '@/components/properties/NodePropertiesForm'
import type { NodePropertiesDrawerProps } from '@/components/properties/types'

export function NodePropertiesDrawer({
  node,
  onChange,
  onClose,
  onReorder,
}: NodePropertiesDrawerProps) {
  const drawer = useRef<HTMLElement>(null)
  const [lastNode, setLastNode] = useState(node)
  const nodeId = node?.id

  // Retain the form during the exit transition, including when its node is deleted.
  if (node && node !== lastNode) {
    setLastNode(node)
  }

  useEffect(() => {
    if (nodeId) {
      drawer.current
        ?.querySelector<HTMLInputElement>('input')
        ?.focus({ preventScroll: true })
    }
  }, [nodeId])

  return (
    <aside
      id="node-properties"
      ref={drawer}
      className={'properties-drawer' + (node ? ' is-open' : '')}
      inert={!node}
      aria-hidden={!node}
      aria-labelledby="properties-heading"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      {lastNode && (
        <NodePropertiesForm
          key={lastNode.id}
          node={lastNode}
          onChange={onChange}
          onClose={onClose}
          onReorder={onReorder}
        />
      )}
    </aside>
  )
}

import type { GizmoProps } from '@/components/gizmo/types'
import { useGizmoInteraction } from '@/components/gizmo/useGizmoInteraction'

export function TransformGizmo(props: GizmoProps) {
  const {
    svg,
    active,
    node,
    center,
    xHandle,
    yHandle,
    scaleHandle,
    rotateHandle,
    handleProps,
    update,
    finish,
    drag,
  } = useGizmoInteraction(props)

  return (
    <svg
      ref={svg}
      className={'transform-gizmo' + (active ? ' is-dragging' : '')}
      width="100%"
      height="100%"
      aria-label={'Transform ' + node.name}
      onPointerMove={update}
      onPointerUp={() => finish()}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && drag.current) {
          event.preventDefault()
          event.stopPropagation()
          finish(true)
        }
      }}
    >
      <g className="gizmo-guides">
        <circle cx={center.x} cy={center.y} r="92" className="gizmo-ring" />
        <path
          d={`M${center.x} ${center.y}L${xHandle.x} ${xHandle.y}`}
          className="gizmo-axis-x"
        />
        <path
          d={`M${center.x} ${center.y}L${yHandle.x} ${yHandle.y}`}
          className="gizmo-axis-y"
        />
        <path
          d={`M${center.x} ${center.y}L${scaleHandle.x} ${scaleHandle.y}`}
          className="gizmo-scale-guide"
        />
      </g>
      <circle
        {...handleProps('move-x', 'Move along parent X')}
        className="gizmo-handle gizmo-x"
        cx={xHandle.x}
        cy={xHandle.y}
        r="9"
      >
        <title>Move along parent X</title>
      </circle>
      <circle
        {...handleProps('move-y', 'Move along parent Y')}
        className="gizmo-handle gizmo-y"
        cx={yHandle.x}
        cy={yHandle.y}
        r="9"
      >
        <title>Move along parent Y</title>
      </circle>
      <circle
        {...handleProps('move', 'Move selected node')}
        className="gizmo-handle gizmo-move"
        cx={center.x}
        cy={center.y}
        r="11"
      >
        <title>Move · Shift snaps to 0.1 · Escape cancels</title>
      </circle>
      <rect
        {...handleProps('scale', 'Scale selected node')}
        className="gizmo-handle gizmo-scale"
        x={scaleHandle.x - 8}
        y={scaleHandle.y - 8}
        width="16"
        height="16"
        rx="2"
      >
        <title>Uniform scale · Shift snaps to 0.1 · Escape cancels</title>
      </rect>
      <circle
        {...handleProps('rotate', 'Rotate selected node')}
        className="gizmo-handle gizmo-rotate"
        cx={rotateHandle.x}
        cy={rotateHandle.y}
        r="9"
      >
        <title>Rotate · Shift snaps to 15° · Escape cancels</title>
      </circle>
      <g className="gizmo-labels" aria-hidden="true">
        <text x={xHandle.x} y={xHandle.y + 3}>
          X
        </text>
        <text x={yHandle.x} y={yHandle.y + 3}>
          Y
        </text>
        <text x={center.x} y={center.y + 4}>
          +
        </text>
        <text
          x={rotateHandle.x + (rotateHandle.x >= center.x ? 16 : -16)}
          y={rotateHandle.y + 4}
          style={{ textAnchor: rotateHandle.x >= center.x ? 'start' : 'end' }}
        >
          Rotate
        </text>
        <text
          x={scaleHandle.x + (scaleHandle.x >= center.x ? 14 : -14)}
          y={scaleHandle.y + 4}
          style={{ textAnchor: scaleHandle.x >= center.x ? 'start' : 'end' }}
        >
          Scale
        </text>
      </g>
    </svg>
  )
}

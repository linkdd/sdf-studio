import type { SceneUniform } from '@/editor/compiler'
import type { Transform } from '@/editor/nodes'
import type { NodeTransform } from '@/editor/transforms'

import { useSceneRenderer } from '@/rendering/useSceneRenderer'

import { TransformGizmo } from '@/components/TransformGizmo'

interface Props {
  glsl: string
  uniforms: readonly SceneUniform[]
  compileError: string | null
  selection: NodeTransform | null
  onTransform: (id: string, transform: Transform) => void
}

export function SceneViewport({
  glsl,
  uniforms,
  compileError,
  selection,
  onTransform,
}: Props) {
  const { canvas, reset, error, view } = useSceneRenderer(glsl, uniforms)

  return (
    <>
      <canvas
        ref={canvas}
        className="scene-canvas"
        aria-label="Rendered SDF scene. Drag to pan; scroll to zoom."
      />
      {selection && view.height > 0 && (
        <TransformGizmo
          key={selection.node.id}
          selection={selection}
          view={view}
          onChange={onTransform}
        />
      )}
      <span className="viewport-label">SCENE / 2D</span>
      <div className="viewport-controls">
        <span>
          {selection
            ? 'Handles: move / scale / rotate · Shift snaps · Esc cancels'
            : 'Drag to pan · Scroll to zoom'}
        </span>
        <button className="polygon-action" onClick={() => reset.current()}>
          Reset view
        </button>
      </div>
      {(compileError || error) && (
        <div className="viewport-error" role="alert">
          <strong>Preview unavailable</strong>
          <pre>{compileError || error}</pre>
        </div>
      )}
    </>
  )
}

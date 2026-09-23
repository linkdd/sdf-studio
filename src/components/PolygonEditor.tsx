import { fitPolygon } from '@/editor/polygon'

import { NumberField } from '@/components/PropertyFields'
import type { PolygonEditorProps } from '@/components/polygon/types'
import { usePolygonEditor } from '@/components/polygon/usePolygonEditor'

export function PolygonEditor(props: PolygonEditorProps) {
  const { vertices } = props
  const {
    svg,
    beginDrag,
    loseCapture,
    gridId,
    selected,
    point,
    projected,
    outline,
    origin,
    setSelection,
    setView,
    moveVertex,
    addVertex,
    deleteVertex,
    dragVertex,
    stopDrag,
    vertexKey,
  } = usePolygonEditor(props)

  return (
    <section
      className="property-section polygon-editor"
      aria-label="Polygon geometry"
    >
      <div className="polygon-toolbar">
        <h3>
          Polygon <span className="count">{vertices.length} vertices</span>
        </h3>
        <button
          className="polygon-action"
          onClick={() => setView(fitPolygon(vertices))}
        >
          Fit view
        </button>
      </div>
      <svg
        ref={svg}
        className="polygon-canvas"
        viewBox="0 0 240 240"
        role="group"
        aria-label="Polygon vertices"
        onPointerMove={dragVertex}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        onLostPointerCapture={loseCapture}
      >
        <defs>
          <pattern
            id={gridId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path d="M24 0H0V24" fill="none" stroke="#27313c" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="240" height="240" fill={'url(#' + gridId + ')'} />
        <path
          d={'M' + origin.x + ' 0V240M0 ' + origin.y + 'H240'}
          className="polygon-axes"
        />
        <polygon points={outline} className="polygon-guide" />
        {projected.map((vertex, index) => {
          const next = projected[(index + 1) % vertices.length]

          return (
            <line
              key={index}
              className="polygon-edge"
              x1={vertex.x}
              y1={vertex.y}
              x2={next.x}
              y2={next.y}
              onDoubleClick={() => addVertex(index)}
            >
              <title>Double-click to insert a vertex</title>
            </line>
          )
        })}
        {projected.map((vertex, index) => (
          <g key={index}>
            <circle
              className={
                'polygon-handle' + (selected === index ? ' selected' : '')
              }
              cx={vertex.x}
              cy={vertex.y}
              r="6"
              role="button"
              tabIndex={0}
              aria-label={'Vertex ' + (index + 1)}
              aria-pressed={selected === index}
              onFocus={() => setSelection(index)}
              onKeyDown={(event) => vertexKey(event, index)}
              onPointerDown={(event) => beginDrag(event, index)}
            />
            <text
              x={vertex.x + 9}
              y={vertex.y - 9}
              className="polygon-point-label"
              aria-hidden="true"
            >
              {index + 1}
            </text>
          </g>
        ))}
      </svg>
      <p className="property-hint">
        Drag vertices or double-click an edge to add one. Coordinates are local;
        Y points up.
      </p>
      <label className="property-field">
        <span>Selected vertex</span>
        <select
          value={selected}
          onChange={(event) => setSelection(Number(event.target.value))}
        >
          {vertices.map((_, index) => (
            <option key={index} value={index}>
              Vertex {index + 1}
            </option>
          ))}
        </select>
      </label>
      <div className="property-grid" key={selected}>
        <NumberField
          label="Vertex X"
          value={point.x}
          step={0.01}
          onChange={(x) => moveVertex(selected, { ...point, x })}
        />
        <NumberField
          label="Vertex Y"
          value={point.y}
          step={0.01}
          onChange={(y) => moveVertex(selected, { ...point, y })}
        />
      </div>
      <div className="polygon-actions">
        <button className="polygon-action" onClick={() => addVertex(selected)}>
          Add vertex
        </button>
        <button
          className="polygon-action"
          disabled={vertices.length <= 3}
          onClick={() => deleteVertex(selected)}
        >
          Remove vertex
        </button>
      </div>
      <p className="property-hint">
        At least 3 vertices. Arrow keys move a focused vertex; Shift moves it
        faster.
      </p>
    </section>
  )
}

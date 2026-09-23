import type { Appearance, NodeProperties } from '@/editor/nodes'

import { ColorField, NumberField } from '@/components/PropertyFields'

export function AppearanceFields({
  style,
  onChange,
}: {
  style: Appearance
  onChange: (properties: Partial<NodeProperties>) => void
}) {
  return (
    <>
      <section className="property-section" aria-label="Fill appearance">
        <label className="property-toggle">
          <span>Fill</span>
          <input
            type="checkbox"
            aria-label="Enable fill"
            checked={style.fill.enabled}
            onChange={(event) =>
              onChange({
                style: {
                  ...style,
                  fill: { ...style.fill, enabled: event.target.checked },
                },
              })
            }
          />
        </label>
        <fieldset disabled={!style.fill.enabled}>
          <ColorField
            label="Fill color"
            value={style.fill.color}
            onChange={(color) =>
              onChange({ style: { ...style, fill: { ...style.fill, color } } })
            }
          />
        </fieldset>
      </section>
      <section className="property-section" aria-label="Stroke appearance">
        <label className="property-toggle">
          <span>Stroke</span>
          <input
            type="checkbox"
            aria-label="Enable stroke"
            checked={style.stroke.enabled}
            onChange={(event) =>
              onChange({
                style: {
                  ...style,
                  stroke: { ...style.stroke, enabled: event.target.checked },
                },
              })
            }
          />
        </label>
        <fieldset disabled={!style.stroke.enabled}>
          <ColorField
            label="Stroke color"
            value={style.stroke.color}
            onChange={(color) =>
              onChange({
                style: { ...style, stroke: { ...style.stroke, color } },
              })
            }
          />
          <NumberField
            label="Stroke width"
            value={style.stroke.width}
            min={0}
            step={0.01}
            onChange={(width) =>
              onChange({
                style: { ...style, stroke: { ...style.stroke, width } },
              })
            }
          />
        </fieldset>
        <p className="property-hint">
          Centered on the boundary, in local scene units.
        </p>
      </section>
    </>
  )
}

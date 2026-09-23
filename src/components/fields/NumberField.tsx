import { useState } from 'react'

import { useNumberScrub } from '@/components/fields/useNumberScrub'

interface NumberFieldProps {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  integer?: boolean
  onChange: (value: number) => void
}

export function NumberField({
  label,
  value,
  min,
  max,
  step = 0.1,
  integer = false,
  onChange,
}: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value))
  const [lastValue, setLastValue] = useState(value)

  // Keep numeric fields in sync with external edits, such as dragging a vertex.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(String(value))
  }

  const { input, drag, scrubbing, begin, move, finish, click } = useNumberScrub(
    {
      value,
      min,
      max,
      step,
      integer,
      onChange,
      setDraft,
    }
  )

  const number = Number(draft)
  const valid =
    draft.trim() !== '' &&
    Number.isFinite(number) &&
    (min === undefined || number >= min) &&
    (max === undefined || number <= max) &&
    (!integer || Number.isInteger(number))

  return (
    <label
      className={
        'property-field number-field' + (scrubbing ? ' is-scrubbing' : '')
      }
      onKeyDown={(event) => {
        if (event.key === 'Escape' && drag.current) {
          event.preventDefault()
          event.stopPropagation()
          finish(true)
        }
      }}
    >
      <span
        className="number-field-label"
        title="Drag left or right to adjust · Shift: finer · Alt: faster · Escape: cancel"
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={(event) => {
          if (drag.current?.pointerId === event.pointerId) {
            move(event)
            finish()
          }
        }}
        onPointerCancel={(event) => {
          if (drag.current?.pointerId === event.pointerId) {
            finish(true)
          }
        }}
        onLostPointerCapture={(event) => {
          if (drag.current?.pointerId === event.pointerId) {
            finish(true)
          }
        }}
        onClick={click}
      >
        {label}
      </span>
      <input
        ref={input}
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        aria-invalid={!valid}
        onChange={(event) => {
          const text = event.target.value
          const next = Number(text)

          setDraft(text)

          if (
            text.trim() &&
            Number.isFinite(next) &&
            (min === undefined || next >= min) &&
            (max === undefined || next <= max) &&
            (!integer || Number.isInteger(next))
          ) {
            onChange(next)
          }
        }}
        onBlur={() => setDraft(String(value))}
      />
    </label>
  )
}

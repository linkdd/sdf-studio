import { useId, useState } from 'react'

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)

  // External edits must update the hex field as well as the native swatch.
  // Keep incomplete user input until the actual color changes or the field blurs.
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  const valid = /^#[0-9a-f]{6}$/i.test(draft)

  return (
    <div className="property-field">
      <label htmlFor={id}>{label}</label>
      <div className="color-fields">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => {
            setDraft(event.target.value)
            onChange(event.target.value)
          }}
        />
        <input
          className="color-hex"
          type="text"
          aria-label={label + ' hex'}
          aria-invalid={!valid}
          aria-describedby={!valid ? id + '-error' : undefined}
          value={draft}
          maxLength={7}
          spellCheck={false}
          onChange={(event) => {
            setDraft(event.target.value)

            if (/^#[0-9a-f]{6}$/i.test(event.target.value)) {
              onChange(event.target.value.toLowerCase())
            }
          }}
          onBlur={() => setDraft(value)}
        />
      </div>
      {!valid && (
        <span id={id + '-error'} className="field-error">
          Use a six-digit hex color, such as #8dddc7.
        </span>
      )}
    </div>
  )
}

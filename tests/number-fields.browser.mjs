import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { NumberField } from '@/components/PropertyFields.tsx'

// Component checks; native pointer capture is also exercised with browser pointer actions.
export async function runNumberFieldTests() {
  const host = document.createElement('div')

  document.body.append(host)

  const root = createRoot(host)
  let value = 1,
    props = {},
    disabled = false,
    changes = [],
    passed = 0

  function render() {
    flushSync(() =>
      root.render(
        createElement(
          'fieldset',
          { disabled },
          createElement(NumberField, {
            label: 'Test number',
            value,
            ...props,
            onChange: (next) => {
              value = next
              changes.push(next)
              render()
            },
          })
        )
      )
    )

    // Synthetic events have no browser pointer to capture. Native capture is checked separately.
    const target = host.querySelector('.number-field-label')

    target.setPointerCapture = () => {}
    target.hasPointerCapture = () => false
  }

  function check(condition, message) {
    if (!condition) {
      throw Error(message)
    }

    passed++
  }

  function reset(next = 1, options = {}) {
    value = next
    props = options
    changes = []
    render()
  }

  function pointer(type, x, extra = {}) {
    flushSync(() =>
      host.querySelector('.number-field-label').dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 1,
          button: 0,
          clientX: x,
          ...extra,
        })
      )
    )
  }

  function type(next) {
    const input = host.querySelector('input')

    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set.call(input, next)
    flushSync(() => input.dispatchEvent(new Event('input', { bubbles: true })))
  }

  const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))

  try {
    reset()
    pointer('pointerdown', 100)
    pointer('pointermove', 110)
    pointer('pointermove', 120)
    check(changes.length === 0, 'Moves should wait for an animation frame')
    await frame()
    check(value === 1.2 && changes.length === 1, 'Moves should be coalesced')
    pointer('pointerup', 130)
    check(value === 1.3, 'Release must commit its final position immediately')

    reset()
    pointer('pointerdown', 100)
    pointer('pointermove', 120, { shiftKey: true })
    pointer('pointerup', 120, { shiftKey: true })
    check(value === 1.02, 'Shift must use fine increments')
    pointer('pointerdown', 100)
    pointer('pointerup', 120, { altKey: true })
    check(value === 3.02, 'Alt must use faster increments')

    reset(1, { min: 0.001, max: 2 })
    pointer('pointerdown', 100)
    pointer('pointermove', -1000)
    await frame()
    check(value === 0.001, 'Drag must respect minimum')
    pointer('pointermove', -990)
    pointer('pointerup', -990)
    check(value === 0.101, 'Reversing at a bound should respond immediately')
    pointer('pointerdown', 100)
    pointer('pointerup', 1000)
    check(value === 2, 'Drag must respect maximum')

    reset(5, { integer: true, step: 1, min: 3, max: 64 })
    pointer('pointerdown', 100)
    pointer('pointerup', 117)
    check(value === 7, 'Integer fields must stay integral')
    type('3.5')
    check(
      value === 7 &&
        host.querySelector('input').getAttribute('aria-invalid') === 'true',
      'Invalid typed integer must stay a draft'
    )
    type('12')
    check(value === 12, 'Direct typing must still work')

    reset()
    pointer('pointerdown', 100)
    pointer('pointermove', 140)
    await frame()
    pointer('pointermove', 160)
    flushSync(() =>
      host
        .querySelector('input')
        .dispatchEvent(
          new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
        )
    )
    await frame()
    check(
      value === 1 && !host.querySelector('.is-scrubbing'),
      'Escape must restore the start and cancel pending updates'
    )

    pointer('pointerdown', 100)
    pointer('pointermove', 140)
    await frame()
    pointer('pointercancel', 140)
    check(value === 1, 'Pointer cancellation must restore the starting value')
    pointer('pointerdown', 100)
    pointer('pointermove', 140)
    await frame()
    pointer('lostpointercapture', 140)
    check(value === 1, 'Lost capture must cancel the drag')

    reset()
    pointer('pointerdown', 100)
    pointer('pointerup', 101)
    check(
      value === 1 && changes.length === 0,
      'Clicking a label must not edit the number'
    )
    pointer('pointerdown', 100, { button: 2 })
    pointer('pointerup', 140)
    check(value === 1, 'Right-click must not edit the number')
    disabled = true
    render()
    pointer('pointerdown', 100)
    pointer('pointerup', 140)
    check(
      value === 1 && !host.querySelector('.is-scrubbing'),
      'Disabled fields must not drag'
    )
    disabled = false
    render()

    pointer('pointerdown', 100)
    pointer('pointermove', 140)
    flushSync(() => root.unmount())
    await frame()
    check(value === 1, 'Unmount must discard pending updates')

    return { passed }
  } finally {
    if (host.childNodes.length) {
      flushSync(() => root.unmount())
    }

    host.remove()
  }
}

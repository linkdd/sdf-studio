import { createElement } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { ColorField } from '@/components/PropertyFields.tsx'

// Run on the development server: import('/tests/color-fields.browser.mjs').then(m => m.runColorFieldTests()).
export function runColorFieldTests() {
  const host = document.createElement('div')

  document.body.append(host)

  const root = createRoot(host)
  let value = '#123456'
  const changes = []

  function render() {
    flushSync(() =>
      root.render(
        createElement(ColorField, {
          label: 'Test color',
          value,
          onChange: (next) => {
            value = next
            changes.push(next)
            render()
          },
        })
      )
    )
  }

  function check(condition, message) {
    if (!condition) {
      throw Error(message)
    }
  }

  function input(selector, next) {
    const field = host.querySelector(selector)

    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set.call(field, next)
    flushSync(() => field.dispatchEvent(new Event('input', { bubbles: true })))
  }

  const hex = () => host.querySelector('.color-hex')
  const swatch = () => host.querySelector('[type=color]')

  try {
    render()
    check(
      hex().value === value && swatch().value === value,
      'Initial color differs'
    )
    input('.color-hex', '#ff0000')
    check(
      value === '#ff0000' && swatch().value === value,
      'Hex edit was not applied'
    )
    input('[type=color]', '#00ff00')
    check(
      value === '#00ff00' && hex().value === value,
      'Picker edit was not applied'
    )
    input('.color-hex', '#12')
    check(
      value === '#00ff00' && hex().value === '#12',
      'Partial hex should remain a draft'
    )
    value = '#0000ff'
    render()
    check(
      hex().value === value && swatch().value === value,
      'External color change left a stale hex value'
    )
    check(changes.length === 2, 'External updates should not emit user changes')

    return { passed: 5 }
  } finally {
    flushSync(() => root.unmount())
    host.remove()
  }
}

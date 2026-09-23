import { createElement, useState } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

import { compilePreviewScene } from '@/editor/compiler.ts'
import { createNode } from '@/editor/nodes.ts'
import { createScene } from '@/editor/tree.ts'

import { ColorField } from '@/components/PropertyFields.tsx'
import { SceneViewport } from '@/components/SceneViewport.tsx'

// Exercise live color input through React and the actual WebGL renderer.
export async function runAppearanceTests() {
  const host = document.createElement('div')
  host.style.cssText =
    'position:fixed;left:0;top:0;width:120px;height:120px;opacity:0;pointer-events:none'
  document.body.append(host)
  const root = createRoot(host)
  const prototype = WebGL2RenderingContext.prototype
  const createProgram = prototype.createProgram
  const drawArrays = prototype.drawArrays
  let programs = 0
  let pixel = []

  prototype.createProgram = function (...args) {
    if (host.contains(this.canvas)) programs++
    return createProgram.apply(this, args)
  }
  prototype.drawArrays = function (...args) {
    drawArrays.apply(this, args)
    if (host.contains(this.canvas)) {
      const bytes = new Uint8Array(4)
      this.readPixels(
        Math.floor(this.canvas.width / 2),
        Math.floor(this.canvas.height / 2),
        1,
        1,
        this.RGBA,
        this.UNSIGNED_BYTE,
        bytes
      )
      pixel = Array.from(bytes)
    }
  }

  function Harness() {
    const [color, setColor] = useState('#ff0000')
    const node = createNode('circle', '1')
    node.style.fill.color = color
    const compilation = compilePreviewScene({
      ...createScene(),
      children: [node],
    })

    return createElement(
      'div',
      { style: { width: 120, height: 120 } },
      createElement(SceneViewport, {
        ...compilation,
        compileError: null,
        selection: null,
        onTransform: () => {},
      }),
      createElement(ColorField, {
        label: 'Fill',
        value: color,
        onChange: setColor,
      })
    )
  }

  const frame = () =>
    new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    )

  try {
    flushSync(() => root.render(createElement(Harness)))
    await frame()
    if (programs !== 1)
      throw Error(`Expected one initial program, got ${programs}`)

    const input = host.querySelector('input[type=color]')
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value'
    ).set

    for (let index = 1; index <= 24; index++) {
      const green = index * 10
      const color = '#00' + green.toString(16).padStart(2, '0') + 'ff'
      setter.call(input, color)
      flushSync(() =>
        input.dispatchEvent(new Event('input', { bubbles: true }))
      )
      await frame()

      if (programs !== 1)
        throw Error('Color editing recompiled the preview shader')
      if (
        pixel.some(
          (value, channel) =>
            Math.abs(value - [0, green, 255, 255][channel]) > 2
        )
      ) {
        throw Error(`Preview pixel did not update: ${pixel}`)
      }
    }

    return { colorUpdates: 24, shaderRebuilds: programs - 1 }
  } finally {
    flushSync(() => root.unmount())
    prototype.createProgram = createProgram
    prototype.drawArrays = drawArrays
    host.remove()
  }
}

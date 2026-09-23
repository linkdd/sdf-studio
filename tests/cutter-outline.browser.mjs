import { compilePreviewScene } from '@/editor/compiler.ts'
import { createNode } from '@/editor/nodes.ts'
import { createScene } from '@/editor/tree.ts'

import {
  createProgram,
  fragmentShader,
  vertexShader,
} from '@/rendering/webgl.ts'

export function runCutterOutlineTests() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 240
  const gl = canvas.getContext('webgl2')
  if (!gl) throw Error('WebGL2 is required')
  gl.disable(gl.DITHER)

  const circle = createNode('circle', 'cut')
  circle.radius = 0.5
  circle.transform.x = 2
  const compound = {
    ...createNode('union', 'compound'),
    children: [createNode('circle', 'left'), createNode('circle', 'right')],
  }
  compound.children[0].transform.x = -0.4
  compound.children[1].transform.x = 0.4
  compound.transform.scale = 0.3
  const operation = {
    ...createNode('subtract', 'subtract'),
    children: [
      createNode('box', 'base'),
      circle,
      compound,
      createNode('group', 'empty'),
    ],
  }
  const scene = { ...createScene(), children: [operation] }
  const original = compilePreviewScene(scene)
  const program = createProgram(
    gl,
    vertexShader,
    fragmentShader(original.glsl, true)
  )
  const pixels = new Uint8Array(canvas.width * canvas.height * 4)
  let passed = 0

  function draw(id) {
    const compiled = compilePreviewScene(scene, id)
    if (compiled.glsl !== original.glsl)
      throw Error('Selection or transforms rebuilt the shader')
    gl.useProgram(program)
    for (const uniform of compiled.uniforms) {
      const location = gl.getUniformLocation(program, uniform.name)
      if (uniform.values.length === 4) gl.uniform4fv(location, uniform.values)
      else gl.uniform1fv(location, uniform.values)
    }
    gl.uniform2f(
      gl.getUniformLocation(program, 'u_resolution'),
      canvas.width,
      canvas.height
    )
    gl.uniform2f(gl.getUniformLocation(program, 'u_center'), 0, 0)
    gl.uniform1f(gl.getUniformLocation(program, 'u_height'), 6)
    gl.uniform1f(gl.getUniformLocation(program, 'u_pixelRatio'), 1)
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      pixels
    )
    const outlined = []
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4
        if (
          pixels[index] > 230 &&
          pixels[index + 1] > 160 &&
          pixels[index + 1] < 220 &&
          pixels[index + 2] < 100
        ) {
          outlined.push({ x: (x + 0.5 - 120) / 40, y: (y + 0.5 - 120) / 40 })
        }
      }
    }
    return outlined
  }

  function check(condition, message) {
    if (!condition) throw Error(message)
    passed++
  }

  try {
    for (const id of [undefined, 'scene', 'base', 'subtract', 'empty']) {
      check(draw(id).length === 0, `${id} should not show a cutter outline`)
    }
    const outside = draw('cut')
    check(
      outside.length > 40,
      'A cutter outside the base should still be visible'
    )
    check(
      outside.every((p) => Math.abs(Math.hypot(p.x - 2, p.y) - 0.5) < 0.05),
      'Outline should follow the cutter geometry'
    )
    check(
      outside.length < 250,
      'The outline should be dashed, not a filled shape'
    )

    circle.transform.x = 0
    check(
      draw('cut').length > 40,
      'A cutter inside the base should remain visible'
    )
    check(
      draw('compound').length > 40,
      'A compound cutter should show its combined silhouette'
    )

    operation.transform = { x: 0.5, y: 0.5, rotation: 90, scale: 2 }
    circle.transform.x = 0.4
    const moved = draw('cut')
    check(moved.length > 40, 'Transformed cutter should have an outline')
    check(
      moved.every((p) => Math.abs(Math.hypot(p.x - 0.5, p.y - 1.3) - 1) < 0.05),
      'Outline must include ancestor translation, rotation and scale'
    )

    return { passed, shaderPrograms: 1 }
  } finally {
    gl.deleteProgram(program)
  }
}

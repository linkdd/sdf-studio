// Browser integration checks: import this module from the Vite origin and call runWebGLTests().
// Uses actual GPU shader compilation, distance samples, and appearance pixels.
import nestedAppearance from '/tests/fixtures/nested-appearance.json'

import { compilePreviewScene, compileScene } from '@/editor/compiler.ts'
import { createNode } from '@/editor/nodes.ts'
import { createScene } from '@/editor/tree.ts'

import { createProgram, vertexShader } from '@/rendering/webgl.ts'

export function runPreviewWebGLTests() {
  return runWebGLTests(compilePreviewScene)
}

export function runWebGLTests(compiler = compileScene) {
  const canvas = document.createElement('canvas')

  canvas.width = canvas.height = 1

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    premultipliedAlpha: false,
  })

  if (!gl) {
    throw Error('WebGL2 is required for GPU integration tests')
  }

  gl.disable(gl.DITHER)

  const passed = []
  let id = 0
  const node = (kind, properties = {}) => ({
    ...createNode(kind, String(++id)),
    ...properties,
  })
  const transform = (x = 0, y = 0, rotation = 0, scale = 1) => ({
    x,
    y,
    rotation,
    scale,
  })
  const style = (fill, stroke = '#000000', width = 0) => ({
    fill: { enabled: !!fill, color: fill || '#000000' },
    stroke: { enabled: width > 0, color: stroke, width },
  })

  function sample(
    children,
    checks,
    appearance = false,
    sceneTransform = [1, 0, 0, 0, 1, 0, 0, 0, 1]
  ) {
    const { glsl, uniforms } = compiler({ ...createScene(), children })
    const fragment = `#version 300 es
precision highp float;
precision highp int;
uniform vec2 point;
uniform mat3 sceneTransform;
out vec4 outColor;
${glsl}
void main() {
${
  appearance
    ? 'outColor = sdSceneColor(point, sceneTransform, 0.0001);'
    : `uint bits = floatBitsToUint(sdScene(point, sceneTransform));
outColor = vec4(uvec4(bits, bits >> 8u, bits >> 16u, bits >> 24u) & uvec4(255u)) / 255.0;`
}
}`
    const program = createProgram(gl, vertexShader, fragment)

    try {
      gl.useProgram(program)

      for (const uniform of uniforms) {
        const location = gl.getUniformLocation(program, uniform.name)

        if (uniform.values.length === 4) {
          gl.uniform4fv(location, uniform.values)
        } else {
          gl.uniform1fv(location, uniform.values)
        }
      }

      gl.uniformMatrix3fv(
        gl.getUniformLocation(program, 'sceneTransform'),
        false,
        sceneTransform
      )
      gl.viewport(0, 0, 1, 1)

      const point = gl.getUniformLocation(program, 'point')

      for (const [label, x, y, expected] of checks) {
        gl.uniform2f(point, x, y)
        gl.drawArrays(gl.TRIANGLES, 0, 3)

        const bytes = new Uint8Array(4)

        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, bytes)

        const actual = appearance
          ? Array.from(bytes)
          : new DataView(bytes.buffer).getFloat32(0, true)
        const okay = appearance
          ? expected.every((v, i) => Math.abs(v - actual[i]) <= 2)
          : Number.isFinite(actual) &&
            Math.abs(actual - expected) <=
              Math.max(0.0001, Math.abs(expected) * 0.00001)

        if (!okay) {
          throw Error(
            `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
          )
        }

        passed.push(label)
      }
    } finally {
      gl.deleteProgram(program)
    }
  }

  try {
    sample([], [['empty scene', 0, 0, 1e20]])
    sample(
      [node('circle')],
      [
        ['circle inside', 0, 0, -1],
        ['circle boundary', 1, 0, 0],
        ['circle outside', 2, 0, 1],
      ]
    )
    sample(
      [node('box')],
      [
        ['box center', 0, 0, -0.6],
        ['box corner outside', 1.1, 1, 0.5],
      ]
    )
    sample(
      [node('rounded-box')],
      [
        ['rounded box center', 0, 0, -0.6],
        ['rounded box corner', 0.8, 0.6, Math.sqrt(0.08) - 0.2],
      ]
    )
    sample(
      [node('box', { width: 4, height: 1 })],
      [
        ['wide box center', 0, 0, -0.5],
        ['wide box right edge', 2, 0, 0],
        ['wide box top edge', 0, 0.5, 0],
      ]
    )
    sample(
      [node('rounded-box', { width: 1, height: 3 })],
      [
        ['tall rounded box center', 0, 0, -0.5],
        ['tall rounded box top edge', 0, 1.5, 0],
        ['tall rounded box corner', 0.5, 1.5, Math.sqrt(0.08) - 0.2],
      ]
    )
    sample(
      [node('rounded-box', { width: 0.1, height: 2 })],
      [
        ['thin rounded box center', 0, 0, -0.05],
        ['thin rounded box top', 0, 1, 0],
        ['thin rounded box side', 0.05, 0, 0],
      ]
    )
    sample(
      [node('rounded-box', { width: 0.2, height: 0.2 })],
      [
        ['tiny rounded box center', 0, 0, -0.1],
        ['tiny rounded box corner', 0.1, 0.1, Math.sqrt(0.02) - 0.1],
      ]
    )
    sample(
      [node('box', { width: 4, height: 1, transform: transform(1, 2, 90, 2) })],
      [
        ['resized transformed box top', 1, 6, 0],
        ['resized transformed box right', 2, 2, 0],
      ]
    )
    sample(
      [
        node('box', {
          width: 4,
          height: 1,
          style: style('#ff0000', '#00ff00', 0.2),
        }),
      ],
      [
        ['resized box fill', 1.5, 0, [255, 0, 0, 255]],
        ['resized box stroke', 2, 0, [0, 255, 0, 255]],
        ['resized box exterior', 2.2, 0, [0, 0, 0, 0]],
      ],
      true
    )
    sample(
      [node('triangle')],
      [
        ['triangle center', 0, 0, -0.5],
        ['triangle vertex', 0, 1, 0],
        ['triangle outside', 0, -1, 0.5],
      ]
    )
    sample(
      [node('ellipse')],
      [
        ['ellipse center', 0, 0, -0.6],
        ['ellipse major axis', 1.2, 0, 0.2],
        ['ellipse minor axis', 0, 0.8, 0.2],
        ['ellipse inside axis', 0.3, 0, -Math.sqrt(0.309375)],
      ]
    )
    sample(
      [node('capsule')],
      [
        ['capsule inside', 0, 0, -0.3],
        ['capsule cap', 1, 0, 0.1],
      ]
    )
    sample(
      [node('segment')],
      [
        ['segment on line', 0, 0, 0],
        ['segment off line', 0, 0.3, 0.3],
        ['segment endpoint', 1, 0, 0.2],
      ]
    )

    const vertices = [
      { x: -1, y: -1 },
      { x: 1, y: -1 },
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: -1, y: 1 },
    ]

    sample(
      [node('polygon', { vertices })],
      [
        ['concave polygon inside', 0, -0.5, -0.5],
        ['concave notch', 0, 0.5, Math.sqrt(0.125)],
      ]
    )
    sample(
      [node('polygon', { vertices: [...vertices, vertices[0]] })],
      [['repeated vertex stays finite', 0, -0.5, -0.5]]
    )
    sample(
      [node('star')],
      [
        ['star outer vertex', 0, 1, 0],
        ['star exterior', 0, 2, 1],
      ]
    )
    sample(
      [node('arc')],
      [
        ['arc center is hollow', 0, 0, 0.7],
        ['arc top', 0, 0.8, -0.1],
        [
          'arc gap',
          0,
          -0.8,
          Math.hypot(0.56568542495, 0.8 - 0.56568542495) - 0.1,
        ],
      ]
    )
    sample(
      [node('circle', { radius: 2.3 })],
      [
        ['custom circle center', 0, 0, -2.3],
        ['custom circle edge', 2.3, 0, 0],
      ]
    )
    sample(
      [node('rounded-box', { width: 4, height: 2, cornerRadius: 0.5 })],
      [['custom rounded corner', 2, 1, Math.sqrt(0.5) - 0.5]]
    )
    sample(
      [node('rounded-box', { cornerRadius: 0 })],
      [['zero corner radius', 0.8, 0.6, 0]]
    )
    sample(
      [node('rounded-box', { width: 0.2, height: 2, cornerRadius: 10 })],
      [['corner radius fits width', 0.1, 0, 0]]
    )
    sample(
      [node('triangle', { width: 4, height: 3 })],
      [
        ['custom triangle base', 0, -1, 0],
        ['custom triangle tip', 0, 2, 0],
        ['custom triangle side', 1, 0.5, 0],
        ['custom triangle center', 0, 0, -1],
      ]
    )
    sample(
      [node('ellipse', { radiusX: 2, radiusY: 1 })],
      [
        ['custom ellipse major edge', 2, 0, 0],
        ['custom ellipse minor exterior', 0, 1.5, 0.5],
        ['custom ellipse center', 0, 0, -1],
      ]
    )
    sample(
      [
        node('capsule', {
          startX: 1,
          startY: -1,
          endX: 1,
          endY: 2,
          radius: 0.4,
        }),
      ],
      [
        ['custom capsule middle', 1, 0.5, -0.4],
        ['custom capsule side', 1.4, 0.5, 0],
        ['custom capsule end', 1, 2.4, 0],
      ]
    )
    sample(
      [
        node('capsule', {
          startX: 1,
          startY: 1,
          endX: 1,
          endY: 1,
          radius: 0.25,
        }),
      ],
      [
        ['zero length capsule', 1, 1, -0.25],
        ['zero length capsule edge', 1.25, 1, 0],
      ]
    )
    sample(
      [node('segment', { startX: -1, startY: 2, endX: 2, endY: -2 })],
      [
        ['custom segment midpoint', 0.5, 0, 0],
        ['custom segment start', -1, 2, 0],
        ['custom segment outside', 2.6, -2.8, 1],
      ]
    )
    sample(
      [node('segment', { startX: 1, startY: 1, endX: 1, endY: 1 })],
      [
        ['zero length segment', 1, 1, 0],
        ['zero length segment distance', 1, 2, 1],
      ]
    )
    sample(
      [node('star', { points: 4, innerRadius: 0.5, outerRadius: 2 })],
      [
        ['four point star tip', 2, 0, 0],
        [
          'custom star inner vertex',
          -Math.SQRT1_2 * 0.5,
          Math.SQRT1_2 * 0.5,
          0,
        ],
        ['custom star exterior', 0, 3, 1],
      ]
    )
    sample([node('star', { points: 64 })], [['maximum star points', 0, 1, 0]])
    sample(
      [
        node('arc', {
          radius: 2,
          tubeRadius: 0.2,
          startAngle: 0,
          sweepAngle: 90,
        }),
      ],
      [
        ['quarter arc start', 2, 0, -0.2],
        ['quarter arc end', 0, 2, -0.2],
        ['quarter arc middle', Math.SQRT2, Math.SQRT2, -0.2],
        ['quarter arc outside sweep', -2, 0, Math.sqrt(8) - 0.2],
        ['quarter arc origin', 0, 0, 1.8],
      ]
    )
    sample(
      [
        node('arc', {
          radius: 2,
          tubeRadius: 0.2,
          startAngle: 450,
          sweepAngle: 90,
        }),
      ],
      [
        ['wrapped arc start', 0, 2, -0.2],
        ['wrapped arc end', -2, 0, -0.2],
        ['wrapped arc outside', 0, -2, Math.sqrt(8) - 0.2],
      ]
    )
    sample(
      [
        node('arc', {
          radius: 2,
          tubeRadius: 0.2,
          startAngle: -450,
          sweepAngle: 0,
        }),
      ],
      [
        ['zero sweep arc cap', 0, -2, -0.2],
        ['zero sweep arc outside', 0, 2, 3.8],
      ]
    )
    sample(
      [node('arc', { radius: 2, tubeRadius: 0.2, sweepAngle: 360 })],
      [
        ['full arc ring', 0, -2, -0.2],
        ['full arc center', 0, 0, 1.8],
      ]
    )
    sample(
      [
        node('group', {
          transform: transform(2, 3, 90, 2),
          children: [node('circle', { transform: transform(1, 0, 0, 0.5) })],
        }),
      ],
      [
        ['nested transformed center', 2, 5, -1],
        ['nested transformed exterior', 2, 7, 1],
      ]
    )
    sample(
      [node('box', { transform: transform(0, 0, 90, 2) })],
      [
        ['rotated box boundary', 0, 1.6, 0],
        ['rotated scaled box exterior', 1.5, 0, 0.3],
      ]
    )

    for (const transition of ['sharp', 'smooth']) {
      const blend = { transition, radius: 0.4 }
      const circles = [
        node('circle', { transform: transform(-0.6) }),
        node('circle', { transform: transform(0.6) }),
      ]

      sample(
        [node('union', { blend, children: circles })],
        [[`${transition} union`, 0, 0, transition === 'sharp' ? -0.4 : -0.5]]
      )
      sample(
        [node('intersect', { blend, children: circles })],
        [
          [
            `${transition} intersection`,
            0,
            0,
            transition === 'sharp' ? -0.4 : -0.3,
          ],
        ]
      )
      sample(
        [
          node('subtract', {
            blend,
            children: [
              node('circle'),
              node('circle', { transform: transform(0.8, 0, 0, 0.6) }),
            ],
          }),
        ],
        [
          [
            `${transition} subtraction`,
            1.2,
            0,
            transition === 'sharp' ? 0.2 : 0.3,
          ],
        ]
      )
    }

    const base = node('circle'),
      cutter = node('circle', { transform: transform(0, 0, 0, 0.5) })

    sample(
      [node('subtract', { children: [base, cutter] })],
      [
        ['subtract hole', 0, 0, 0.5],
        ['subtract ring', 0.75, 0, -0.25],
      ]
    )
    sample(
      [node('subtract', { children: [cutter, base] })],
      [['subtraction order', 0.75, 0, 0.25]]
    )

    const empty = node('group')

    for (const kind of ['group', 'union', 'subtract', 'intersect']) {
      sample([node(kind)], [[`${kind} empty`, 0, 0, 1e20]])
      sample(
        [node(kind, { children: [base] })],
        [[`${kind} one operand`, 0, 0, -1]]
      )
    }

    sample(
      [
        node('union', {
          children: [empty, base],
          blend: { transition: 'smooth', radius: 0.4 },
        }),
      ],
      [['empty union operand', 0, 0, -1]]
    )
    sample(
      [node('subtract', { children: [empty, base] })],
      [['empty subtraction base', 0, 0, 1e20]]
    )
    sample(
      [node('subtract', { children: [base, empty] })],
      [['empty cutter ignored', 0, 0, -1]]
    )
    sample(
      [node('intersect', { children: [base, empty] })],
      [['empty intersection operand', 0, 0, 1e20]]
    )
    sample(
      [node('circle', { style: style(null, '#ff0000', 0.2) })],
      [
        ['stroke hollow center', 0, 0, [0, 0, 0, 0]],
        ['centered stroke inside', 0.95, 0, [255, 0, 0, 255]],
        ['centered stroke outside', 1.05, 0, [255, 0, 0, 255]],
        ['outside stroke', 1.2, 0, [0, 0, 0, 0]],
      ],
      true
    )
    sample(
      [
        node('group', {
          transform: transform(0, 0, 0, 2),
          children: [node('circle', { style: style(null, '#ff0000', 0.2) })],
        }),
      ],
      [['stroke scales with group', 2.15, 0, [255, 0, 0, 255]]],
      true
    )
    sample(
      [
        node('circle', { style: style('#ff0000') }),
        node('circle', { style: style('#0000ff'), transform: transform(0.5) }),
      ],
      [
        ['later sibling on top', 0, 0, [0, 0, 255, 255]],
        ['earlier sibling visible', -0.8, 0, [255, 0, 0, 255]],
      ],
      true
    )
    sample(
      [node('circle', { style: style(null) })],
      [['invisible appearance keeps geometry', 0, 0, -1]]
    )

    const red = node('circle', {
      style: style('#ff0000'),
      transform: transform(-0.6),
    })
    const blue = node('circle', {
      style: style('#0000ff'),
      transform: transform(0.6),
    })

    sample(
      [node('union', { children: [red, blue] })],
      [
        ['union preserves red', -0.8, 0, [255, 0, 0, 255]],
        ['union preserves blue', 0.8, 0, [0, 0, 255, 255]],
      ],
      true
    )
    sample(
      [
        node('union', {
          children: [red, blue],
          blend: { transition: 'smooth', radius: 0.4 },
        }),
      ],
      [['smooth union blends materials', 0, 0, [128, 0, 128, 255]]],
      true
    )
    sample(
      [
        node('intersect', {
          children: [red, blue],
          blend: { transition: 'smooth', radius: 0.4 },
        }),
      ],
      [['smooth intersection blends materials', 0, 0, [128, 0, 128, 255]]],
      true
    )
    sample(
      [
        node('subtract', {
          children: [
            node('circle', { style: style('#ff0000', '#0000ff', 0.2) }),
            cutter,
          ],
        }),
      ],
      [
        ['cut edge uses base stroke', 0.5, 0, [0, 0, 255, 255]],
        ['remaining base uses its fill', 0.75, 0, [255, 0, 0, 255]],
      ],
      true
    )
    sample(
      [
        node('union', {
          transform: transform(0, 0, 0, 2),
          children: [
            node('group', {
              children: [
                node('circle', { style: style(null, '#ff0000', 0.2) }),
              ],
            }),
          ],
        }),
      ],
      [
        [
          'inherited stroke scales through operations',
          2.15,
          0,
          [255, 0, 0, 255],
        ],
      ],
      true
    )
    sample(
      nestedAppearance.scene.children,
      [
        ['reported scene polygon fill', -0.7, 0.8, [255, 0, 0, 255]],
        ['reported scene box fill', -1.7, -0.7, [19, 33, 221, 255]],
        ['reported scene polygon stroke', -1.153, 1.3645, [221, 141, 141, 255]],
        ['reported scene cutout', 0, 0, [0, 0, 0, 0]],
      ],
      true
    )

    const wholeScene = [0, 2, 0, -2, 0, 0, 2, 3, 1]

    // T(2,3) * R(90 degrees) * S(2).
    sample(
      [node('circle')],
      [
        ['whole-scene translated center', 2, 3, -2],
        ['whole-scene scaled distance', 2, 6, 1],
      ],
      false,
      wholeScene
    )
    sample(
      [node('box')],
      [
        ['whole-scene rotated box boundary', 2, 4.6, 0],
        ['whole-scene rotated box exterior', 3.5, 3, 0.3],
      ],
      false,
      wholeScene
    )
    sample(
      [node('circle', { transform: transform(1, 0, 0, 0.5) })],
      [['whole-scene composes with node transform', 2, 5, -1]],
      false,
      wholeScene
    )
    sample(
      [node('circle', { style: style('#ff0000', '#0000ff', 0.2) })],
      [
        ['whole-scene fill', 2, 3, [255, 0, 0, 255]],
        ['whole-scene scaled stroke', 4.15, 3, [0, 0, 255, 255]],
        ['whole-scene outside stroke', 4.3, 3, [0, 0, 0, 0]],
      ],
      true,
      wholeScene
    )
    sample([], [['transformed empty scene', 2, 3, 1e20]], false, wholeScene)
    sample(
      [node('circle')],
      [
        ['nonuniform scale boundary', 2, 0, 0],
        ['nonuniform conservative distance', 4, 0, 1],
      ],
      false,
      [2, 0, 0, 0, 1, 0, 0, 0, 1]
    )
    sample(
      [node('circle')],
      [['reflected uniform scale distance', 0, 0, -2]],
      false,
      [-2, 0, 0, 0, 2, 0, 0, 0, 1]
    )
    sample(
      [node('circle')],
      [['singular transform is empty', 0, 0, 1e20]],
      false,
      [0, 0, 0, 0, 0, 0, 0, 0, 1]
    )
    sample(
      [node('circle')],
      [['singular transform is transparent', 0, 0, [0, 0, 0, 0]]],
      true,
      [0, 0, 0, 0, 0, 0, 0, 0, 1]
    )

    if (gl.getError() !== gl.NO_ERROR) {
      throw Error('WebGL error during integration tests')
    }

    return { passed: passed.length, checks: passed }
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

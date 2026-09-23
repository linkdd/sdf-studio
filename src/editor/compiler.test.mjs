import assert from 'node:assert/strict'
import { test } from 'node:test'

import { compilePreviewScene, compileScene } from '@/editor/compiler.ts'
import { serializeScene } from '@/editor/export.ts'
import { createNode, nodeDefinitions } from '@/editor/nodes.ts'
import { createScene } from '@/editor/tree.ts'

test('all node kinds compile deterministically into an embeddable scene', () => {
  const scene = {
    ...createScene(),
    children: nodeDefinitions.map(({ kind }, i) => createNode(kind, String(i))),
  }
  const first = compileScene(scene).glsl

  assert.equal(first, compileScene(structuredClone(scene)).glsl)
  assert.match(first, /float sdScene\(vec2 p, mat3 sceneTransform\)/)
  assert.match(
    first,
    /vec4 sdSceneColor\(vec2 p, mat3 sceneTransform, float pixelSize\)/
  )
  assert.doesNotMatch(first, /^\s*(?:#version|void main\(|uniform\s)/m)
})

test('node identifiers and names never enter shader source', () => {
  const circle = createNode('circle', 'break; }', '*/ invalid GLSL')
  const glsl = compileScene({ ...createScene(), children: [circle] }).glsl

  assert.doesNotMatch(glsl, /break;|invalid GLSL/)
})

test('nonrepresentable shader coordinates produce a useful compilation error', () => {
  const circle = createNode('circle', '1')

  for (const x of [NaN, Infinity, 1e40]) {
    assert.throws(
      () =>
        compileScene({
          ...createScene(),
          children: [{ ...circle, transform: { ...circle.transform, x } }],
        }),
      /numeric range/
    )
  }
})

test('scene export includes the full model without editor UI state', () => {
  const scene = { ...createScene(), children: [createNode('polygon', '1')] }

  assert.deepEqual(JSON.parse(serializeScene('Example', scene)), {
    version: 1,
    name: 'Example',
    scene,
  })
})

test('preview transform edits change uniforms without changing shader source', () => {
  const scene = {
    ...createScene(),
    children: [
      { ...createNode('group', 'g'), children: [createNode('polygon', 'p')] },
    ],
  }
  const original = compilePreviewScene(scene)
  const edited = structuredClone(scene)

  edited.children[0].transform = { x: 2, y: -3, rotation: 90, scale: 2 }
  edited.children[0].children[0].transform.scale = 0.5

  const changed = compilePreviewScene(edited)

  assert.equal(changed.glsl, original.glsl)
  assert.notDeepEqual(changed.uniforms, original.uniforms)
  assert.deepEqual(
    Array.from(
      changed.uniforms.find((u) => u.name === 'sdf_node0_pose').values
    ).slice(0, 2),
    [2, -3]
  )
  assert.equal(
    changed.uniforms.find((u) => u.name === 'sdf_node1_scale').values[0],
    0.5
  )
  assert.notEqual(compileScene(edited).glsl, compileScene(scene).glsl)
  assert.deepEqual(compileScene(edited).uniforms, [])
  edited.children.push(createNode('circle', 'new'))
  assert.notEqual(compilePreviewScene(edited).glsl, original.glsl)
})

test('preview and exported shader apply the same numeric validation', () => {
  const scene = { ...createScene(), children: [createNode('circle', '1')] }

  for (const transform of [{ x: Infinity }, { scale: 0 }, { rotation: NaN }]) {
    const invalid = {
      ...scene,
      children: [
        {
          ...scene.children[0],
          transform: { ...scene.children[0].transform, ...transform },
        },
      ],
    }

    assert.throws(() => compileScene(invalid))
    assert.throws(() => compilePreviewScene(invalid))
  }
})

test('both compilers reject invalid rectangle dimensions', () => {
  for (const compiler of [compileScene, compilePreviewScene]) {
    for (const kind of ['box', 'rounded-box']) {
      for (const field of ['width', 'height']) {
        for (const value of [undefined, 0, -1, NaN, Infinity, 1e-7, 1e31]) {
          const node = { ...createNode(kind, 'rect'), [field]: value }

          assert.throws(
            () => compiler({ ...createScene(), children: [node] }),
            /rectangle dimensions/
          )
        }
      }
    }
  }
})

test('preview appearance edits reuse shader source while exports include the new style', () => {
  const shape = createNode('circle', '1')
  const scene = {
    ...createScene(),
    children: [{ ...createNode('clip', 'clip'), children: [shape] }],
  }
  const original = compilePreviewScene(scene)

  for (const fillEnabled of [false, true]) {
    for (const strokeEnabled of [false, true]) {
      const edited = structuredClone(scene)
      edited.children[0].children[0].style = {
        fill: { enabled: fillEnabled, color: '#ff0080' },
        stroke: { enabled: strokeEnabled, color: '#00ff00', width: 0.25 },
      }
      const changed = compilePreviewScene(edited)
      const uniform = (name) =>
        Array.from(changed.uniforms.find((u) => u.name.endsWith(name)).values)

      assert.equal(changed.glsl, original.glsl)
      assert.deepEqual(
        uniform('_fill'),
        fillEnabled ? [1, 0, Math.fround(128 / 255), 1] : [0, 0, 0, 0]
      )
      assert.deepEqual(
        uniform('_stroke'),
        strokeEnabled ? [0, 1, 0, 1] : [0, 0, 0, 0]
      )
      assert.deepEqual(uniform('_strokeWidth'), [0.25])
      assert.notEqual(compileScene(edited).glsl, compileScene(scene).glsl)
      assert.deepEqual(compileScene(edited).uniforms, [])
      assert.doesNotMatch(compileScene(edited).glsl, /^uniform /m)
    }
  }
})

test('preview and export reject the same invalid appearance values', () => {
  for (const compiler of [compileScene, compilePreviewScene]) {
    for (const update of [
      (style) => {
        style.stroke.width = Infinity
      },
      (style) => {
        style.fill.color = '#zzzzzz'
      },
    ]) {
      const shape = createNode('circle', '1')
      update(shape.style)
      assert.throws(() => compiler({ ...createScene(), children: [shape] }))
    }
  }
})

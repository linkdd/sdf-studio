import { compileAppearance } from '@/editor/compiler/appearance.ts'
import { helperFunctions } from '@/editor/compiler/helpers.ts'
import { distanceBodyTemplate } from '@/editor/compiler/templates/combinedDistance.ts'
import { materialBodyTemplate } from '@/editor/compiler/templates/combinedMaterial.ts'
import { nodeColorTemplate } from '@/editor/compiler/templates/nodeColor.ts'
import { nodeDistanceTemplate } from '@/editor/compiler/templates/nodeDistance.ts'
import { nodeMaterialTemplate } from '@/editor/compiler/templates/nodeMaterial.ts'
import { nodePaintTemplate } from '@/editor/compiler/templates/nodePaint.ts'
import { sceneTemplate } from '@/editor/compiler/templates/scene.ts'
import { compileTransform } from '@/editor/compiler/transform.ts'
import type {
  CompiledScene,
  NodeFunctions,
  SceneUniform,
} from '@/editor/compiler/types.ts'
import type { SceneNode, SceneRoot } from '@/editor/nodes.ts'

export function compile(
  scene: SceneRoot,
  dynamicProperties: boolean
): CompiledScene {
  const uniforms: SceneUniform[] = []
  const declarations: string[] = []
  const functions: string[] = []
  let nextIndex = 0

  function emit(node: SceneNode): NodeFunctions {
    const name = `sdf_node${nextIndex++}`
    const children = node.children.map(emit)
    const active = children.filter((child) => !child.empty)
    const container =
      node.kind === 'group' || node.kind === 'clip' || 'blend' in node
    const empty = !!(
      container &&
      (active.length === 0 ||
        ((node.kind === 'subtract' || node.kind === 'clip') &&
          children[0]?.empty) ||
        (node.kind === 'intersect' && children.some((child) => child.empty)))
    )

    const { local, scale } = compileTransform(
      node,
      name,
      dynamicProperties,
      declarations,
      uniforms
    )
    const distance = distanceBodyTemplate(node, active, empty, container)
    const appearance =
      'style' in node
        ? compileAppearance(
            node.style,
            name,
            dynamicProperties,
            declarations,
            uniforms
          )
        : null
    const material = materialBodyTemplate(
      node,
      active,
      empty,
      local,
      appearance
    )
    const paint = nodePaintTemplate({
      name,
      local,
      scaleValue: scale,
      empty,
      group: node.kind === 'group',
      clipEdge: node.kind === 'clip' ? node.clipEdge : null,
      active,
    })

    functions.push(
      nodeDistanceTemplate(
        name,
        local,
        distance,
        empty ? '1e20' : 'd * ' + scale
      ),
      nodeMaterialTemplate(name, material, scale),
      nodeColorTemplate(name, paint)
    )

    return {
      distance: name,
      paint: `${name}_color`,
      material: `${name}_material`,
      empty,
    }
  }

  const roots = scene.children.map(emit).filter((child) => !child.empty)
  const distance = roots.length
    ? roots
        .map((child) => `${child.distance}(p)`)
        .reduce((a, b) => `min(${a}, ${b})`)
    : '1e20'

  return {
    uniforms,
    glsl: sceneTemplate({
      dynamicProperties,
      declarations,
      helpers: helperFunctions(),
      functions,
      roots,
      distance,
    }),
  }
}

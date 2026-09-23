import { color, scalar } from '@/editor/compiler/literals.ts'
import type { Appearance } from '@/editor/nodes.ts'

export function materialExpression(style: Appearance): string {
  const fill = style.fill.enabled
    ? `vec4(${color(style.fill.color)}, 1.0)`
    : 'vec4(0.0)'
  const stroke = style.stroke.enabled
    ? `vec4(${color(style.stroke.color)}, 1.0)`
    : 'vec4(0.0)'

  return `sdf_Material(${fill}, ${stroke}, ${scalar(style.stroke.width)})`
}

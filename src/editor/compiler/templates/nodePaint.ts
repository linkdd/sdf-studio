import { clipPaintTemplate } from '@/editor/compiler/templates/clipPaint.ts'
import type { NodeFunctions } from '@/editor/compiler/types.ts'

interface Parameters {
  name: string
  local: string
  scaleValue: string
  empty: boolean
  group: boolean
  clip: boolean
  active: readonly NodeFunctions[]
}

export function nodePaintTemplate({
  name,
  local,
  scaleValue,
  empty,
  group,
  clip,
  active,
}: Parameters): string {
  let paint: string

  if (empty) {
    paint = 'return vec4(0.0);'
  } else if (clip) {
    paint = clipPaintTemplate(local, scaleValue, active)
  } else if (group) {
    paint = `${local}\n    vec4 result = vec4(0.0);`

    for (const child of active) {
      paint += `\n    result = sdf_over(${child.paint}(q, pixelSize / ${scaleValue}), result);`
    }

    paint += '\n    return result;'
  } else {
    paint = `return sdf_paint(${name}(p), pixelSize, ${name}_material(p));`
  }

  return paint
}

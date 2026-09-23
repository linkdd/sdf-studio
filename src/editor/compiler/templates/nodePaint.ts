import type { NodeFunctions } from '@/editor/compiler/types.ts'

interface Parameters {
  name: string
  local: string
  scaleValue: string
  empty: boolean
  group: boolean
  active: readonly NodeFunctions[]
}

export function nodePaintTemplate({
  name,
  local,
  scaleValue,
  empty,
  group,
  active,
}: Parameters): string {
  let paint: string

  if (empty) {
    paint = 'return vec4(0.0);'
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

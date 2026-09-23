import { boxTemplate } from '@/editor/compiler/templates/helpers/box.ts'
import { ellipseTemplate } from '@/editor/compiler/templates/helpers/ellipse.ts'
import { materialTemplate } from '@/editor/compiler/templates/helpers/material.ts'
import { mixMaterialTemplate } from '@/editor/compiler/templates/helpers/mixMaterial.ts'
import { overTemplate } from '@/editor/compiler/templates/helpers/over.ts'
import { paintTemplate } from '@/editor/compiler/templates/helpers/paint.ts'
import { sceneScaleTemplate } from '@/editor/compiler/templates/helpers/sceneScale.ts'
import { segmentTemplate } from '@/editor/compiler/templates/helpers/segment.ts'
import { smoothMaxTemplate } from '@/editor/compiler/templates/helpers/smoothMax.ts'
import { smoothMinTemplate } from '@/editor/compiler/templates/helpers/smoothMin.ts'

export function helperFunctions(): string {
  return [
    segmentTemplate(),
    boxTemplate(),
    ellipseTemplate(),
    smoothMinTemplate(),
    smoothMaxTemplate(),
    sceneScaleTemplate(),
    overTemplate(),
    materialTemplate(),
    mixMaterialTemplate(),
    paintTemplate(),
  ].join('\n')
}

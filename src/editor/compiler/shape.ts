import { arcTemplate } from '@/editor/compiler/templates/shapes/arc.ts'
import { boxTemplate } from '@/editor/compiler/templates/shapes/box.ts'
import { capsuleTemplate } from '@/editor/compiler/templates/shapes/capsule.ts'
import { circleTemplate } from '@/editor/compiler/templates/shapes/circle.ts'
import { ellipseTemplate } from '@/editor/compiler/templates/shapes/ellipse.ts'
import { polygonTemplate } from '@/editor/compiler/templates/shapes/polygon.ts'
import { segmentTemplate } from '@/editor/compiler/templates/shapes/segment.ts'
import { starTemplate } from '@/editor/compiler/templates/shapes/star.ts'
import { triangleTemplate } from '@/editor/compiler/templates/shapes/triangle.ts'
import { isPrimitiveKind, parseGeometry } from '@/editor/geometry.ts'
import type { ShapeNode } from '@/editor/nodes.ts'

export function shapeBody(node: ShapeNode): string {
  if (isPrimitiveKind(node.kind)) {
    parseGeometry(node.kind, node)
  }

  switch (node.kind) {
    case 'circle':
      return circleTemplate(node)
    case 'rounded-box':
    case 'box':
      return boxTemplate(node)
    case 'triangle':
      return triangleTemplate(node)
    case 'ellipse':
      return ellipseTemplate(node)
    case 'capsule':
      return capsuleTemplate(node)
    case 'segment':
      return segmentTemplate(node)
    case 'polygon':
      return polygonTemplate(node.vertices)
    case 'star':
      return starTemplate(node)
    case 'arc':
      return arcTemplate(node)
  }
}

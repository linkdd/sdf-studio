interface Parameters {
  cosine: string
  sine: string
  position: string
  scale: string
}

export function localTransformTemplate({
  cosine,
  sine,
  position,
  scale,
}: Parameters): string {
  return `vec2 q = mat2(${cosine}, -(${sine}), ${sine}, ${cosine}) * (p - ${position}) / ${scale};`
}

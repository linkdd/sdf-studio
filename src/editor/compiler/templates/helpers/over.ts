export function overTemplate(): string {
  return `// Premultiplied alpha: top composited over bottom.
vec4 sdf_over(vec4 top, vec4 bottom) {

    return top + bottom * (1.0 - top.a);
}`
}

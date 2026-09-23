export function nodeColorTemplate(name: string, body: string): string {
  return `vec4 ${name}_color(vec2 p, float pixelSize) {
    ${body}
}`
}

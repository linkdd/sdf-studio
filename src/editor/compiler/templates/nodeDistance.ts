export function nodeDistanceTemplate(
  name: string,
  local: string,
  body: string,
  result: string
): string {
  return `float ${name}(vec2 p) {
    ${local}
    ${body}
    return ${result};
}`
}

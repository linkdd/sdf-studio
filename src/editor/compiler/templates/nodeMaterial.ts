export function nodeMaterialTemplate(
  name: string,
  body: string,
  scale: string
): string {
  return `sdf_Material ${name}_material(vec2 p) {
    ${body}
    result.width *= ${scale};
    return result;
}`
}

export function smoothMaxTemplate(): string {
  return `float sdf_smoothMax(float a, float b, float radius) {

    return -sdf_smoothMin(-a, -b, radius);
}`
}

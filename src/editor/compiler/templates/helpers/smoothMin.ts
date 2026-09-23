export function smoothMinTemplate(): string {
  return `float sdf_smoothMin(float a, float b, float radius) {
    float h = clamp(0.5 + 0.5 * (b - a) / radius, 0.0, 1.0);

    return mix(b, a, h) - radius * h * (1.0 - h);
}`
}

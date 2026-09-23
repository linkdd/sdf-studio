export function paintTemplate(): string {
  return `vec4 sdf_paint(float d, float pixelSize, sdf_Material material) {
    float aa = max(pixelSize * 0.75, 1e-7);
    float f = 1.0 - smoothstep(-aa, aa, d);
    float s = material.width > 0.0
        ? 1.0 - smoothstep(-aa, aa, abs(d) - material.width * 0.5)
        : 0.0;

    return sdf_over(material.stroke * s, material.fill * f);
}`
}

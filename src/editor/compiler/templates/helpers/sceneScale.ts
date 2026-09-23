export function sceneScaleTemplate(): string {
  return `// Minimum singular value of the affine 2D transform. Exact distance scaling for
// uniform scale; conservative distance bound for nonuniform scale or shear.
float sdf_sceneScale(mat3 sceneTransform) {
    vec2 a = sceneTransform[0].xy, b = sceneTransform[1].xy;
    float normalization = max(max(abs(a.x), abs(a.y)), max(abs(b.x), abs(b.y)));
    if (normalization == 0.0) return 0.0;
    a /= normalization;
    b /= normalization;
    float sum = dot(a, a) + dot(b, b);
    float det = a.x * b.y - a.y * b.x;
    float largest = sqrt(0.5 * (sum + sqrt(max(0.0, sum * sum - 4.0 * det * det))));

    return normalization * abs(det) / largest;
}`
}

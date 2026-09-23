export function segmentTemplate(): string {
  return `// Helpers use the sdf_ prefix to avoid collisions with host shaders.
float sdf_segment(vec2 p, vec2 a, vec2 b) {
    vec2 e = b - a;
    float t = clamp(dot(p - a, e) / max(dot(e, e), 1e-20), 0.0, 1.0);

    return length(p - a - t * e);
}`
}

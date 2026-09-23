export function boxTemplate(): string {
  return `float sdf_box(vec2 p, vec2 halfSize) {
    vec2 q = abs(p) - halfSize;

    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}`
}

import { vec } from '@/editor/compiler/literals.ts'
import type { Point } from '@/editor/polygon.ts'

export function polygonTemplate(vertices: readonly Point[]): string {
  return `const vec2 vertices[${vertices.length}] = vec2[${vertices.length}](
        ${vertices.map(({ x, y }) => vec(x, y)).join(',\n        ')}
    );
    float distanceToEdge = 1e30;
    bool inside = false;
    for (int i = 0, j = ${vertices.length - 1}; i < ${vertices.length}; j = i, ++i) {
        vec2 a = vertices[j], b = vertices[i];
        distanceToEdge = min(distanceToEdge, sdf_segment(q, a, b));
        if ((a.y > q.y) != (b.y > q.y)) {
            float crossing = a.x + (q.y - a.y) * (b.x - a.x) / (b.y - a.y);
            if (q.x < crossing) inside = !inside;
        }
    }
    float d = inside ? -distanceToEdge : distanceToEdge;`
}

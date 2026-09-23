export function ellipseTemplate(): string {
  return `// Numerical closest point on a first-quadrant ellipse (including endpoints).
float sdf_ellipse(vec2 p, vec2 radii) {
    p = abs(p);
    float best = 1e30;
    float angle = 0.0;
    const float stepAngle = 1.5707963267948966 / 16.0;

    for (int i = 0; i <= 16; ++i) {
        float t = float(i) * stepAngle;
        vec2 delta = radii * vec2(cos(t), sin(t)) - p;
        float d = dot(delta, delta);
        if (d < best) {
            best = d;
            angle = t;
        }
    }

    float lo = max(0.0, angle - stepAngle);
    float hi = min(1.5707963267948966, angle + stepAngle);

    for (int i = 0; i < 24; ++i) {
        float a = mix(lo, hi, 1.0 / 3.0);
        float b = mix(lo, hi, 2.0 / 3.0);
        vec2 da = radii * vec2(cos(a), sin(a)) - p;
        vec2 db = radii * vec2(cos(b), sin(b)) - p;
        if (dot(da, da) < dot(db, db)) {
            hi = b;
        } else {
            lo = a;
        }
    }

    float t = (lo + hi) * 0.5;
    vec2 delta = radii * vec2(cos(t), sin(t)) - p;
    float d = sqrt(min(best, dot(delta, delta)));

    return dot(p / radii, p / radii) < 1.0 ? -d : d;
}`
}

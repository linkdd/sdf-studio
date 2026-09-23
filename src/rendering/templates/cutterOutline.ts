export function cutterOutlineTemplate(): string {
  return `float cutter = sdf_selectedCutter(p);
    float outlinePixel = pixelSize * u_pixelRatio;
    vec2 normal = vec2(dFdx(cutter), dFdy(cutter));
    float along = abs(normal.x) > abs(normal.y) ? gl_FragCoord.y : gl_FragCoord.x;
    float dash = step(0.35, fract(along / (10.0 * u_pixelRatio)));
    float line = 1.0 - smoothstep(outlinePixel * 0.8, outlinePixel * 1.8, abs(cutter));
    float halo = 1.0 - smoothstep(outlinePixel * 1.8, outlinePixel * 2.8, abs(cutter));
    color = mix(color, vec3(0.07, 0.08, 0.10), halo * dash * 0.85);
    color = mix(color, vec3(1.0, 0.76, 0.30), line * dash);`
}

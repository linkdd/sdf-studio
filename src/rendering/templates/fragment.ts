export function fragmentShader(glsl: string): string {
  return `#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_height;
out vec4 outColor;
${glsl}
void main() {
    float pixelSize = u_height / u_resolution.y;
    vec2 p = u_center + (gl_FragCoord.xy - u_resolution * 0.5) * pixelSize;
    float spacing = exp2(floor(log2(max(pixelSize * 80.0, 1e-8))));
    vec2 gridDistance = abs(fract(p / spacing + 0.5) - 0.5) * spacing;
    float grid = 1.0 - smoothstep(pixelSize * 0.5, pixelSize * 1.5, min(gridDistance.x, gridDistance.y));
    float axes = 1.0 - smoothstep(pixelSize * 0.5, pixelSize * 1.5, min(abs(p.x), abs(p.y)));
    vec3 background = mix(vec3(0.067, 0.086, 0.11), vec3(0.13, 0.17, 0.20), grid * 0.55);
    background = mix(background, vec3(0.22, 0.28, 0.31), axes * 0.7);
    vec4 scene = sdSceneColor(p, mat3(1.0), pixelSize);
    outColor = vec4(scene.rgb + background * (1.0 - scene.a), 1.0);
}`
}

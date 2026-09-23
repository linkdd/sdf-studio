// No user-provided names or IDs become GLSL identifiers.
export function scalar(value: number): string {
  if (!Number.isFinite(value) || Math.abs(value) > 1e30) {
    throw new Error(
      'Scene values must be finite and within the GLSL numeric range (±1e30).'
    )
  }

  const text = Object.is(value, -0) ? '0' : String(value)

  return /[.e]/i.test(text) ? text : text + '.0'
}

export const vec = (x: number, y: number) => `vec2(${scalar(x)}, ${scalar(y)})`
export const color = (hex: string) =>
  `vec3(${[1, 3, 5].map((start) => scalar(parseInt(hex.slice(start, start + 2), 16) / 255)).join(', ')})`

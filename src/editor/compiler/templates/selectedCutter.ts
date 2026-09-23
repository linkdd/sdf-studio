export function selectedCutterTemplate(
  local: string,
  candidates: readonly { index: number; distance: string }[]
): string {
  const branches = candidates.map(
    ({ index, distance }) =>
      `if (sdf_cutterIndex == ${index}.0) return ${distance}(q) * sdf_cutterParentScale;`
  )

  return `float sdf_selectedCutter(vec2 p) {
    ${local}
    ${branches.join('\n    ')}
    return 1e20;
}`
}

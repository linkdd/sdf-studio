export function mixMaterialTemplate(): string {
  return `sdf_Material sdf_mixMaterial(sdf_Material a, sdf_Material b, float h) {

    return sdf_Material(mix(a.fill, b.fill, h), mix(a.stroke, b.stroke, h), mix(a.width, b.width, h));
}`
}

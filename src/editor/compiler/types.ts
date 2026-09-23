export interface SceneUniform {
  readonly name: string
  readonly values: Float32Array
}

export interface CompiledScene {
  readonly glsl: string
  readonly uniforms: readonly SceneUniform[]
}

export interface NodeFunctions {
  readonly distance: string
  readonly paint: string
  readonly material: string
  readonly empty: boolean
}

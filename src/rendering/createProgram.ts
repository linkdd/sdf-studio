export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string
): WebGLProgram {
  const shaders: WebGLShader[] = []
  const program = gl.createProgram()

  if (!program) {
    throw new Error('Unable to allocate a WebGL program.')
  }

  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type)

      if (!shader) {
        throw new Error('Unable to allocate a WebGL shader.')
      }

      shaders.push(shader)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(
          gl.getShaderInfoLog(shader) || 'Shader compilation failed.'
        )
      }

      gl.attachShader(program, shader)
    }

    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Shader linking failed.')
    }

    return program
  } catch (error) {
    gl.deleteProgram(program)

    throw error
  } finally {
    for (const shader of shaders) {
      // Deletion is deferred while a shader remains attached to its program.
      gl.deleteShader(shader)
    }
  }
}

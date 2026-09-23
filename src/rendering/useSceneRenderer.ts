import { useEffect, useRef, useState } from 'react'

import type { SceneUniform } from '@/editor/compiler'
import type { Viewport } from '@/editor/transforms'

import { createCameraControls } from '@/rendering/cameraControls'
import { createProgram, fragmentShader, vertexShader } from '@/rendering/webgl'

export function useSceneRenderer(
  glsl: string,
  uniforms: readonly SceneUniform[]
) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const updateUniforms = useRef<(values: readonly SceneUniform[]) => void>(
    () => {}
  )
  const camera = useRef({ x: 0, y: 0, height: 6 })
  const [view, setView] = useState<Viewport>({
    width: 0,
    height: 0,
    camera: { x: 0, y: 0, height: 6 },
  })
  const reset = useRef(() => {})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const element = canvas.current!
    const gl = element.getContext('webgl2', { antialias: false, alpha: false })

    function report(message: string | null) {
      setError(message)
    }

    if (!gl) {
      report(
        'WebGL2 is unavailable in this browser. Generated code and JSON export remain available.'
      )

      return
    }

    let program: WebGLProgram | null = null
    let resolution: WebGLUniformLocation | null = null
    let center: WebGLUniformLocation | null = null
    let height: WebGLUniformLocation | null = null
    let latestUniforms: readonly SceneUniform[] = []
    let uniformsDirty = true
    const locations = new Map<string, WebGLUniformLocation | null>()
    let frame = 0
    let disposed = false

    function draw() {
      frame = 0

      if (!gl || !program || disposed || gl.isContextLost()) {
        return
      }

      const bounds = element.getBoundingClientRect()

      if (!bounds.width || !bounds.height) {
        return
      }

      const nextView = {
        width: bounds.width,
        height: bounds.height,
        camera: { ...camera.current },
      }

      setView((previous) =>
        previous.width === nextView.width &&
        previous.height === nextView.height &&
        previous.camera.x === nextView.camera.x &&
        previous.camera.y === nextView.camera.y &&
        previous.camera.height === nextView.camera.height
          ? previous
          : nextView
      )

      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(bounds.width * ratio))
      const canvasHeight = Math.max(1, Math.round(bounds.height * ratio))

      if (element.width !== width || element.height !== canvasHeight) {
        element.width = width
        element.height = canvasHeight
      }

      gl.viewport(0, 0, width, canvasHeight)
      gl.useProgram(program)

      if (uniformsDirty) {
        for (const uniform of latestUniforms) {
          if (!locations.has(uniform.name)) {
            locations.set(
              uniform.name,
              gl.getUniformLocation(program, uniform.name)
            )
          }

          const location = locations.get(uniform.name)!

          if (uniform.values.length === 4) {
            gl.uniform4fv(location, uniform.values)
          } else {
            gl.uniform1fv(location, uniform.values)
          }
        }

        uniformsDirty = false
      }

      gl.uniform2f(resolution, width, canvasHeight)
      gl.uniform2f(center, camera.current.x, camera.current.y)
      gl.uniform1f(height, camera.current.height)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    function schedule() {
      if (!frame && !disposed) {
        frame = requestAnimationFrame(draw)
      }
    }

    function rebuild() {
      if (!gl || disposed) {
        return
      }

      try {
        if (program) {
          gl.deleteProgram(program)
        }

        program = null

        if (!glsl) {
          gl.clearColor(0.067, 0.086, 0.11, 1)
          gl.clear(gl.COLOR_BUFFER_BIT)
          report(null)

          return
        }

        program = createProgram(gl, vertexShader, fragmentShader(glsl))
        locations.clear()
        uniformsDirty = true
        resolution = gl.getUniformLocation(program, 'u_resolution')
        center = gl.getUniformLocation(program, 'u_center')
        height = gl.getUniformLocation(program, 'u_height')
        report(null)
        schedule()
      } catch (cause) {
        gl.clearColor(0.067, 0.086, 0.11, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        report(
          cause instanceof Error ? cause.message : 'Unable to render scene.'
        )
      }
    }

    function lost(event: Event) {
      event.preventDefault()
      program = null
      report('WebGL context lost. Waiting for the browser to restore it…')
    }

    const { down, move, up, wheel } = createCameraControls(
      element,
      camera,
      schedule
    )

    reset.current = () => {
      camera.current = { x: 0, y: 0, height: 6 }
      schedule()
    }

    const observer = new ResizeObserver(schedule)

    observer.observe(element)
    window.addEventListener('resize', schedule)
    element.addEventListener('webglcontextlost', lost)
    element.addEventListener('webglcontextrestored', rebuild)
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    element.addEventListener('lostpointercapture', up)

    const surface = element.parentElement!

    surface.addEventListener('wheel', wheel, { passive: false })
    updateUniforms.current = (values) => {
      latestUniforms = values
      uniformsDirty = true
      schedule()
    }
    rebuild()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      element.removeEventListener('webglcontextlost', lost)
      element.removeEventListener('webglcontextrestored', rebuild)
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
      element.removeEventListener('lostpointercapture', up)
      surface.removeEventListener('wheel', wheel)
      element.classList.remove('is-panning')

      if (program) {
        gl.deleteProgram(program)
      }

      reset.current = () => {}
      updateUniforms.current = () => {}
    }
  }, [glsl])

  useEffect(() => {
    updateUniforms.current(uniforms)
  }, [glsl, uniforms])

  return { canvas, reset, error, view }
}

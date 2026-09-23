export interface Point {
  readonly x: number
  readonly y: number
}

export function defaultPolygon(): Point[] {
  return Array.from({ length: 5 }, (_, index) => {
    const angle = Math.PI / 2 + (index * 2 * Math.PI) / 5

    return {
      x: Number(Math.cos(angle).toFixed(4)),
      y: Number(Math.sin(angle).toFixed(4)),
    }
  })
}

export function isPolygonVertices(value: unknown): value is readonly Point[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.every(
      (point) =>
        typeof point === 'object' &&
        point !== null &&
        typeof point.x === 'number' &&
        Number.isFinite(point.x) &&
        typeof point.y === 'number' &&
        Number.isFinite(point.y)
    )
  )
}

export function insertVertex(
  vertices: readonly Point[],
  after: number
): readonly Point[] {
  if (after < 0 || after >= vertices.length) {
    return vertices
  }

  const a = vertices[after]
  const b = vertices[(after + 1) % vertices.length]

  return [
    ...vertices.slice(0, after + 1),
    { x: a.x / 2 + b.x / 2, y: a.y / 2 + b.y / 2 },
    ...vertices.slice(after + 1),
  ]
}

export function removeVertex(
  vertices: readonly Point[],
  index: number
): readonly Point[] {
  if (vertices.length <= 3 || index < 0 || index >= vertices.length) {
    return vertices
  }

  return vertices.filter((_, current) => current !== index)
}

export interface PolygonView {
  readonly x: number
  readonly y: number
  readonly size: number
}

export function fitPolygon(vertices: readonly Point[]): PolygonView {
  const xs = vertices.map((point) => point.x)
  const ys = vertices.map((point) => point.y)
  const left = Math.min(...xs)
  const right = Math.max(...xs)
  const bottom = Math.min(...ys)
  const top = Math.max(...ys)

  return {
    x: left / 2 + right / 2,
    y: bottom / 2 + top / 2,
    size: Math.max(right - left, top - bottom, 0.1) * 1.4,
  }
}

export function toPolygonCanvas(point: Point, view: PolygonView): Point {
  return {
    x: 120 + ((point.x - view.x) * 240) / view.size,
    y: 120 - ((point.y - view.y) * 240) / view.size,
  }
}

export function fromPolygonCanvas(point: Point, view: PolygonView): Point {
  return {
    x: view.x + ((point.x - 120) * view.size) / 240,
    y: view.y - ((point.y - 120) * view.size) / 240,
  }
}

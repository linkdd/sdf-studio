# Node library

To add a node, drag it from the library into the [scene graph](scene-graph.md).
All dimensions below are in the node's local coordinates.

## Scene

Every scene starts with this root node. All the nodes you add belong to it, either
directly or through another node. The root cannot be moved, renamed, or removed.

See [properties](node-properties.md#scene).

## Circle

A circle centered at the origin, with an editable radius (1 by default). You can
draw it filled, with an outline, or both. To cut a circular hole into another
shape, use it as a child of a Subtract node.

See [properties](node-properties.md#circle).

## Box

A rectangle centered at the origin, with editable width and height. It starts at
1.6 units wide and 1.2 units high, with sharp corners. You can rotate and scale it,
or combine it with other shapes through Boolean operations.

See [properties](node-properties.md#box).

## Rounded box

A box with editable width, height, and corner radius. It starts at 1.6 × 1.2,
with a corner radius of 0.2. The corners are capped at half the shorter side so
that they always fit inside the box.

See [properties](node-properties.md#rounded-box).

## Triangle

An isosceles triangle pointing up, with editable width and height. It starts as
an equilateral triangle, about 1.732 units wide and 1.5 units high. Its origin
stays at the centroid, so you can change its proportions and rotate it around
that point.

See [properties](node-properties.md#triangle).

## Ellipse

An ellipse centered at the origin, with independent horizontal and vertical
radii. They start at 1 and 0.6. With only the stroke enabled, we can use it to
draw an orbit, for example.

See [properties](node-properties.md#ellipse).

## Capsule

A segment with rounded ends. You can edit both endpoints and the radius around
them. It starts with endpoints (-0.6, 0) and (0.6, 0), and a radius of 0.3.
Moving the endpoints to the same position gives you a circle.

See [properties](node-properties.md#capsule).

## Segment

A line between two editable endpoints, initially (-0.8, 0) and (0.8, 0). It has
no interior, so new segments have only their stroke enabled. The stroke gives
the line a visible thickness, but does not change its geometry when used in a
Boolean operation.

See [properties](node-properties.md#segment).

## Polygon

A closed shape whose vertices you can edit. It starts as a regular pentagon with a
radius of 1. You can move, add, and remove vertices to make your own shape, including
concave polygons. The last vertex is always connected to the first.

See [properties](node-properties.md#polygon).

## Star

A star with an editable point count and two radii that alternate around its
center. It starts with five points, an outer radius of 1, and an inner radius
of 0.45. Change the radii to make its points longer or shorter.

See [properties](node-properties.md#star).

## Arc

A section of a circle with editable radius, tube radius, start angle, and sweep.
It starts with a radius of 0.8, a tube radius of 0.1, and a 270° sweep from -45°,
leaving an opening at the bottom. A 360° sweep closes it into a ring.

See [properties](node-properties.md#arc).

## Group

A group lets you organize nodes and move, rotate, or scale them together. Each child
keeps its own fill and stroke. Children are drawn in order, so later children appear on
top of earlier ones.

See [properties](node-properties.md#group).

## Union

A union combines its children into one shape. Where shapes meet, the junction can be
sharp or smooth. The result uses the colors and strokes of its children, blending them
at smooth junctions. The union itself has no style.

See [properties](node-properties.md#union).

## Subtract

A subtraction cuts shapes out of another shape. The first child is the base, and every
child after it is a cutter. The result keeps the fill and stroke of the base, including
along the new cut edges. Cuts can be sharp or smooth.

See [properties](node-properties.md#subtract).

## Intersect

An intersection keeps the area shared by all its children. For example, intersecting a
circle with a box clips the circle to the inside of the box. The junction can be sharp
or smooth, and the result gets its appearance from the children.

See [properties](node-properties.md#intersect).

## Clip

Clip keeps the first child visible and draws all the following children inside
its geometry. Each child keeps its own fill and stroke, and later children are
drawn on top. For example, put a circle first and a larger star second: the
circle remains visible behind the star, whose tips stop at the circle's edge.
This is a clipping group rather than an intersection of all the children. See
[properties](node-properties.md#clip).

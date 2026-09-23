# Node properties

Click the pen beside a node to open its properties. Changes appear in the
visualization and are saved in local storage, so they survive a browser reload.

## Dragging numeric values

Drag a numeric field's label left or right to decrease or increase its value.
This works for transforms, shape dimensions, polygon coordinates, stroke width,
and smoothing radius. You can still click the input and type a value directly.

Hold Shift for finer adjustments, or Alt to move faster. Release to keep the
value, or press Escape while dragging to restore the starting value. Dragging
respects the field's limits, and whole-number fields such as star points stay
whole numbers. Disabled fields cannot be dragged.

## Shared transform and name

Every node except Scene has the following properties:

| Property | What it changes |
| --- | --- |
| Name | The name shown in the scene graph |
| Position X / Y | Position relative to the parent; Y points up |
| Rotation (°) | Rotation relative to the parent, counterclockwise for positive values |
| Scale | Uniform scale, which must stay positive |

When you scale a group or an operation, its children and their stroke widths
scale with it. You can edit the transform with the
[gizmos](scene-graph.md#viewport-controls) too.

## Shape geometry

Each primitive has a **Geometry** section. Dimensions and endpoint coordinates
are local to the node, so editing them leaves its transform unchanged. Changing
a radius or a length also leaves the stroke width unchanged; Scale changes both.
Polygon has its vertex editor instead.

Lengths and radii must be positive (between `1e-6` and `1e30`), except for the
corner radius, which can be zero. Endpoint coordinates can be negative or zero.
Invalid values are not applied, and leaving the field restores its last valid value.

## Shape appearance

Shapes have a **Fill** toggle and a **Fill color**, then a **Stroke** toggle,
a **Stroke color**, and a **Stroke width**. You can enable fill and stroke
independently. Color and width controls become available when you enable the
corresponding toggle.

Stroke width is measured in local coordinates and is centered on the boundary.
For example, a width of 0.2 puts 0.1 units on each side of it. Width can be zero.

These properties change how the shape is drawn. Disabling fill does not make the
geometry hollow: to cut a hole, use a [Subtract](node-library.md#subtract) node.
Groups and operations have no style properties.

## Operation blending

Union, Subtract, and Intersect have a **Transition** setting:

- **Sharp** keeps hard junctions between the children.
- **Smooth** rounds the junctions and exposes a **Smoothing radius**.

The radius must be positive and is measured in the operation's local coordinates.
It defaults to 0.1. Switching back to Sharp keeps the value, so it is still there
if you enable Smooth again. This setting changes the geometry; antialiasing is
handled separately by the renderer.

Use the up/down buttons in **Operands** to change the order of the children.
Smooth operations combine children in that order.

## Scene

[Scene](node-library.md#scene) has no editable properties. The root is always
named **Scene**. To rename your document, edit the scene title in the toolbar.

## Circle

The [Circle](node-library.md#circle) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Radius** changes the circle's size. It defaults to 1. The center stays at the
local origin.

## Box

The [Box](node-library.md#box) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Width** and **Height** change the full dimensions independently. They default
to 1.6 and 1.2. The box stays centered on its origin.

## Rounded box

The [Rounded box](node-library.md#rounded-box) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Width** and **Height** change the full dimensions independently, starting at
1.6 and 1.2. **Corner radius** defaults to 0.2; set it to zero for sharp corners.
The radius used for rendering is capped at half the shorter side. Your entered
value is kept, so enlarging the box lets the corners grow back to that radius.

## Triangle

The [Triangle](node-library.md#triangle) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Width** is the length of the base, and **Height** is the distance from the base
to the tip. They default to √3 (about 1.732) and 1.5. The triangle is symmetric
around its local Y axis, with its origin at the centroid. Its tip is at
`(0, 2 * height / 3)` and the base at `Y = -height / 3`.

## Ellipse

The [Ellipse](node-library.md#ellipse) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Radius X** and **Radius Y** change the horizontal and vertical radii
independently. They default to 1 and 0.6. The center stays at the local origin.

## Capsule

The [Capsule](node-library.md#capsule) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Start X / Y** and **End X / Y** set the endpoints of the center line.
**Radius** sets the distance from that line to the surface, including the
rounded ends. The defaults are (-0.6, 0), (0.6, 0), and 0.3. You can place the
endpoints anywhere in local coordinates, including at the same position to make
a circle.

## Segment

The [Segment](node-library.md#segment) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Start X / Y** and **End X / Y** set the endpoints in local coordinates. They
default to (-0.8, 0) and (0.8, 0). Endpoints can coincide, giving a point.
**Stroke width** controls the visible thickness. New segments have fill disabled
and stroke enabled, since a segment has no interior.

## Polygon

The [Polygon](node-library.md#polygon) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties, plus an editor for its vertices.

Drag a vertex to move it, or select it and edit **Vertex X** and **Vertex Y**.
Coordinates are local to the polygon, with Y pointing up.

To add a vertex, double-click an edge. The new vertex appears at its midpoint.
You can also click **Add vertex** to insert one after the selected vertex.
**Remove vertex** removes the selected one, as long as at least three remain.

A focused vertex accepts arrow keys (0.01 units, or 0.1 with Shift), and Delete
or Backspace to remove it. **Fit view** adjusts the editor's view to show the
whole polygon, without changing any vertex.

The polygon editor keeps a simple outline. Fill and stroke colors are shown in
the main visualization.

## Star

The [Star](node-library.md#star) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Points** sets the number of points, from 3 to 64 (whole numbers only).
**Outer radius** places the tips and **Inner radius** places the alternating
vertices between them. The defaults are 5, 1, and 0.45. Both radii are editable
independently; an inner radius smaller than the outer one gives the usual star
shape. One outer tip points up before rotation.

## Arc

The [Arc](node-library.md#arc) has the shared
[name and transform](#shared-transform-and-name) and
[fill and stroke](#shape-appearance) properties.

**Radius** sets the radius of the arc's center line, and **Tube radius** sets the
thickness around that line. They default to 0.8 and 0.1. Tube radius changes the
geometry itself; Stroke width controls the outline drawn around it.

**Start angle (°)** is measured counterclockwise from +X. **Sweep (°)** is the
counterclockwise angle covered from that start, between 0° and 360°. The defaults
are -45° and 270°. A zero sweep leaves just a round end cap, and a full sweep
makes a ring. Start angles can wrap around: 450° has the same effect as 90°.

## Group

You can edit the [Group](node-library.md#group)'s
[name and transform](#shared-transform-and-name). In **Children**, use the up/down
buttons to change the drawing order. Later children are drawn on top. Each child
keeps its own style; the group has no fill, stroke, or blending settings.

## Union

The [Union](node-library.md#union) has the shared
[name and transform](#shared-transform-and-name), plus
[blending properties](#operation-blending). Use **Operands** to reorder its
children. Their appearance determines the result, so there are no fill or stroke
controls on the union itself.

## Subtract

The [Subtract](node-library.md#subtract) has the shared
[name and transform](#shared-transform-and-name), plus
[blending properties](#operation-blending). In **Operands**, the first child is
labeled **Base** and the others **Cutter**. Move a child to the top to make it the
base. The result uses the base's fill and stroke.

## Intersect

The [Intersect](node-library.md#intersect) has the shared
[name and transform](#shared-transform-and-name), plus
[blending properties](#operation-blending). Use **Operands** to reorder its
children. As with Union, the result gets its appearance from the children.

# Scene graph

The scene graph describes how the nodes are organized. You can find it between
the node library and the visualization.

We start with a single [Scene](node-library.md#scene) node. To add something to it,
drag a node from the library and drop it on Scene. To add a child to a group or
an operation, drop the node on that parent instead.

## Hierarchy rules

Shapes cannot have children. Scene, groups, and operations can contain any shape,
group, or operation:

| Parent | Allowed children |
| --- | --- |
| [Scene](node-library.md#scene) | Shapes, groups, operations |
| [Group](node-library.md#group) | Shapes, groups, operations |
| [Union](node-library.md#union), [Subtract](node-library.md#subtract), [Intersect](node-library.md#intersect) | Shapes, groups, operations |
| Shape | None |

The Scene root is immutable: you cannot move it, rename it, or remove it. You also
cannot move a node inside itself or one of its children, as that would create a
cycle in the tree.

You can drag an existing node onto another parent to move it there, along with
all its children. It becomes the last child of that parent. To change the order,
open the parent's properties and use the up/down buttons in **Children** or
**Operands**. For Scene and Group, later children are drawn over earlier ones.

The arrow beside a container expands or collapses it. Clicking a node opens its
[properties](node-properties.md), or switches the drawer to that node if it is
already open. The pen also opens the properties and focuses the first field.
The × removes the node along with its children.

## Parent transforms

Let's say we have a group containing a box and a circle. If we move the group,
both shapes move with it. The same applies to rotation and scale.

This works because each node's transform is relative to its parent. The children
keep their local values when we edit the group. They also keep those values when
we move them to a different parent, so their position in the scene may change if
the new parent has a different transform.

## Assembling Boolean operations

Let's make a hole in a rounded box. We need a [Subtract](node-library.md#subtract)
node with two children: the rounded box first, then a circle.

```text
Scene
└── Subtract
    ├── Rounded box (base)
    └── Circle (cutter)
```

The first child is the shape we cut into. All the following children are cutters.
Scale the circle down so that it fits inside the box, and we have our hole.
We can move it around to change where the hole is, or add more cutters. To change
which shape is the base, reorder the children in the Subtract properties.

The other operations work with the same parent/children structure:

- [Union](node-library.md#union) combines the children into one shape. Two
  overlapping circles become one surface.
- [Intersect](node-library.md#intersect) keeps only the area shared by the
  children. A circle inside a box gives us the part of the circle that fits
  within that box.

We can also nest operations. For example, a Union can combine two circles, then
be used as the cutter of a Subtract. A Group can be an operand too; its children
contribute their combined geometry.

An empty operation has no surface. With one child, it returns that child unchanged.
Add at least two children to see the operation combine shapes.

## Sharp and smooth blending

Each operation has a **Transition** property. **Sharp** keeps sharp junctions
between the shapes. **Smooth** rounds those junctions and lets you choose a
**Smoothing radius**. The radius is measured in the operation's local coordinates.
See [blending properties](node-properties.md#operation-blending).

The operation also determines how the result is colored. Union and Intersect
use the appearance of the contributing children, blending their fill, stroke,
and stroke width at smooth junctions. Subtract always uses the base appearance,
including on cut edges. Operations have no fill or stroke of their own.

Fill and stroke only affect how a shape is drawn. Disabling a cutter's fill,
for example, will not stop it from cutting. Smooth operations combine children
in order, so changing their order can change the result.

Use a Group to organize shapes that keep their individual outlines. Use a Union
when you want an outline around the combined shape.

## Viewport controls

Select a node to show its gizmo in the visualization:

- Drag the center to move it freely.
- Drag X or Y to move it along that axis of its parent.
- Drag the square to scale it uniformly.
- Drag the rotation handle to rotate it.

Hold Shift to snap movement to 0.1 local units, scale to 0.1, or rotation to 15°.
Escape cancels the drag. You can also focus a handle and use the arrow keys:
0.01 units for movement or scale, and 1° for rotation. Shift increases those steps
to 0.1 and 15°.

Select Scene to hide the gizmo. Drag the background to pan, scroll to zoom, and
click **Reset view** to return to the origin with six units visible vertically.
Moving the camera does not change the scene or its exports.

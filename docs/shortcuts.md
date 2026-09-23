# Keyboard shortcuts

## Undo and redo

Press **Ctrl+Z** to undo and **Ctrl+Y** (or **Ctrl+Shift+Z**) to redo. On macOS,
use Command instead of Ctrl. This covers node edits, hierarchy changes, scene
renaming, and JSON imports. A gizmo, polygon, or numeric-label drag is one edit,
even if it updates many times. Text fields keep their usual editing shortcuts.

The editor remembers the last 100 edits during the current session. Reloading
keeps the scene but starts a new undo history. Camera movement, selection, and
opening or closing panels do not create undo entries.

## Copy, cut, and paste

Select a node in the scene graph, then use these shortcuts. On macOS, use
Command instead of Ctrl.

| Shortcut | Action |
| --- | --- |
| Ctrl+C | Copy the selected node and all its children. |
| Ctrl+X | Copy the selected subtree, then remove it from the scene. |
| Ctrl+V | Paste a copy with new IDs and select it. |

With a container selected, paste adds the subtree as its last child. With a
shape selected, paste inserts it immediately after that shape. Names,
geometry, colors, and local transforms are preserved. Moving the copy under a
different parent can therefore change its position in the scene.

Scene itself cannot be copied or cut. Cut and paste are undoable. The clipboard
contains node JSON, so copies also work between SDF Studio tabs. Unrelated text
is ignored; invalid node data leaves the scene unchanged. When an input or the
code viewer has focus, these shortcuts apply to text instead.

## Navigation and properties

These shortcuts act on the focused control. Use **Tab** and **Shift+Tab** to
move focus between controls.

| Shortcut | Where | Action |
| --- | --- | --- |
| Enter or Space | A button | Activate it, including selecting a node, opening properties, or expanding a branch. |
| Left or Right | Visualization / Code tabs | Switch to the other tab. |
| Home | Visualization / Code tabs | Switch to Visualization. |
| End | Visualization / Code tabs | Switch to Code. |
| Enter | Scene name | Finish renaming and leave the field. |
| Escape | Properties drawer | Close the drawer and return focus to the node that opened it. |
| Up or Down | A numeric input | Adjust the value by the input's step. |

Text inputs keep the browser's usual selection, copy, cut, paste, and undo
shortcuts. Scene shortcuts do not override text editing or the GLSL viewer.

## Transform gizmos

Select a node, then focus a gizmo handle to use the keyboard. Movement is in
parent coordinates; scale is uniform.

| Shortcut | Action |
| --- | --- |
| Arrow keys on the center handle | Move by 0.01 units in the arrow's direction. |
| Arrow keys on X or Y | Move along that axis by 0.01 units. Right/Up increases; Left/Down decreases. |
| Arrow keys on the scale handle | Change scale by 0.01. Right/Up increases; Left/Down decreases. |
| Arrow keys on the rotation handle | Rotate by 1°. Right/Up increases; Left/Down decreases. |
| Shift + Arrow keys | Use 0.1 units for movement or scale, and 15° for rotation. |
| Shift while dragging | Snap movement to 0.1 units, scale to 0.1, and rotation to 15°. |
| Escape during a gizmo drag | Cancel the drag and restore the original transform. |

## Polygon editor

These shortcuts apply to a focused vertex in the polygon editor.

| Shortcut | Action |
| --- | --- |
| Enter or Space | Select the vertex for coordinate editing. |
| Arrow keys | Move the vertex by 0.01 units. |
| Shift + Arrow keys | Move the vertex by 0.1 units. |
| Delete or Backspace | Remove the vertex, provided at least three vertices remain. |

## Draggable numeric fields

Drag a numeric field's label left or right to adjust its value. Ten pixels
normally correspond to one input step.

| Shortcut | Action |
| --- | --- |
| Shift while dragging a label | Adjust at one tenth of the normal speed. |
| Alt while dragging a label | Adjust at ten times the normal speed. |
| Escape during a label drag | Cancel the drag and restore the original value. |

When Shift and Alt are both held, Shift takes priority. Cancelling a numeric
label drag does not close the properties drawer.

## Viewport camera

Drag the background with the left or middle mouse button to pan. Scroll to
zoom around the pointer. **Reset view** returns the camera to the origin.
These controls change the view, not the scene.

## Generated GLSL

The code viewer is read-only. CodeMirror provides its own navigation, selection,
search, and folding shortcuts while it has focus. In the tables below, **Mod**
means Ctrl on Windows/Linux and Command on macOS.

| Shortcut | Action |
| --- | --- |
| Arrow keys | Move the cursor. Hold Shift to extend the selection. |
| Ctrl+Left/Right; Option+Left/Right on macOS | Move by word. Hold Shift to extend the selection. |
| Alt+Left/Right; Ctrl+Left/Right on macOS | Move between syntax boundaries. Hold Shift to extend the selection. |
| Home / End | Move to the start or end of the line. Hold Shift to select. |
| Command+Left/Right on macOS | Move to the start or end of the line. Hold Shift to select. |
| Mod+Home / Mod+End; Command+Up/Down on macOS | Move to the start or end of the document. Hold Shift to select. |
| Page Up / Page Down; Ctrl+Up/Down on macOS | Move by page. Hold Shift to select. |
| Mod+A | Select all code. |
| Mod+C | Copy selected code. |
| Alt+L; Ctrl+L on macOS | Select the current line. |
| Mod+I | Expand the selection to the enclosing syntax node. |
| Mod+Alt+Up/Down | Add a cursor above or below. |
| Mod+Shift+\ | Move to the matching bracket. |
| Mod+U | Undo the last selection change. |
| Alt+U; Command+Shift+U on macOS | Redo the last selection change. |
| Escape | Simplify multiple selections, or close the search panel. |
| Ctrl+M; Shift+Option+M on macOS | Toggle Tab focus mode. Tab normally moves focus out of the viewer. |

On macOS, CodeMirror also accepts **Ctrl+B/F** for character movement,
**Ctrl+P/N** for line movement, **Ctrl+A/E** for line start/end, and **Ctrl+V**
for moving down a page. Shift extends the selection for the character and line
movement commands.

| Search shortcut | Action |
| --- | --- |
| Mod+F | Open or focus the search panel. |
| Mod+G or F3 | Find the next match. |
| Mod+Shift+G or Shift+F3 | Find the previous match. |
| Enter / Shift+Enter in the search field | Find the next / previous match. |
| Mod+D | Select the next occurrence of the selection. |
| Mod+Shift+L | Select all occurrences of the selection. |
| Mod+Alt+G | Open the go-to-line dialog. Enter confirms; Escape closes it. |

| Folding shortcut | Action |
| --- | --- |
| Ctrl+Shift+[; Command+Option+[ on macOS | Fold the current block. |
| Ctrl+Shift+]; Command+Option+] on macOS | Unfold the current block. |
| Ctrl+Alt+[ | Fold all blocks. |
| Ctrl+Alt+] | Unfold all blocks. |

Folding and syntax navigation depend on the GLSL parser's available structure.
Commands that would edit the generated code are disabled.

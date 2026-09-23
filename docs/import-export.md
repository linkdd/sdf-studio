# Import & Export

## JSON export

To save an editable copy of your scene, click **Export JSON**. The file contains
the scene name and the whole tree: nodes, child order, transforms, fill and stroke,
shape dimensions, endpoints, angles, polygon vertices, and blending settings.

For example, an empty scene looks like this:

```json
{
  "version": 1,
  "name": "Untitled scene",
  "scene": {
    "id": "scene",
    "kind": "root",
    "name": "Scene",
    "children": []
  }
}
```

Selection, open drawers, collapsed branches, and camera position are not exported.
For a complete example, see [Orbital Courier](examples/orbital-courier.json).

## JSON import

Click **Import JSON** and select a scene file. The editor checks the document,
then replaces the current scene and its name. Export your current scene first
if you want to keep it.

Importing also resets selection, the properties drawer, collapsed branches, and
the camera. The imported scene is saved in local storage automatically, just like
any scene you edit.

If the file contains invalid JSON, an unsupported version, duplicate IDs, or
invalid node properties, the editor shows an error and keeps your current scene.
The supported format is version 1.

## GLSL export

Once you have a scene, click **Export GLSL** to use it in your own shader.
You can preview the generated code in the **Code** tab. The code includes helper
functions and two entry points:

```glsl
float sdScene(vec2 p, mat3 sceneTransform);
vec4 sdSceneColor(vec2 p, mat3 sceneTransform, float pixelSize);
```

`sdScene` gives you the distance to the scene at `p`: negative inside, positive
outside. A Segment has no interior, so its distance is unsigned. Use this function
if you want to handle shading yourself.

`sdSceneColor` gives you the fill and stroke, with antialiasing. Its result is
premultiplied RGBA: RGB already includes alpha. `pixelSize` is the size of one
screen pixel in the same coordinates as `p`.

Both functions take a `mat3` so that you can translate, rotate, and scale the whole
scene. Pass `mat3(1.0)` to leave it unchanged. The exported code contains the current
node values and does not depend on the editor.

## Fragment shader example

Let's render the scene over a dark background. We will use a GLSL ES 3.00 fragment
shader, with a `resolution` uniform containing the viewport size in pixels.

Paste the exported code before `main`. It does not include the version, precision,
uniforms, or output declaration, so we provide those in our shader:

```glsl
#version 300 es
precision highp float;
uniform vec2 resolution;
out vec4 fragColor;

// Paste exported GLSL here (helpers, sdScene, sdSceneColor).

void main() {
    float pixelSize = 6.0 / resolution.y;
    vec2 p = (gl_FragCoord.xy - resolution * 0.5) * pixelSize;
    // GLSL matrices are column-major: translate * rotate * uniform scale.
    float angle = radians(30.0);
    float scale = 0.75;
    vec2 position = vec2(1.0, 0.5);
    float c = cos(angle), s = sin(angle);
    mat3 sceneTransform = mat3(
        scale * c, scale * s, 0.0,
       -scale * s, scale * c, 0.0,
        position.x, position.y, 1.0
    );
    vec4 scene = sdSceneColor(p, sceneTransform, pixelSize); // Premultiplied RGBA.
    vec3 background = vec3(0.07, 0.09, 0.11);
    fragColor = vec4(scene.rgb + background * (1.0 - scene.a), 1.0);
}
```

Here, `p` uses coordinates centered on the viewport, with six units visible
vertically. That makes one pixel `6.0 / resolution.y` units wide.

The matrix scales the scene by 0.75, rotates it by 30°, then translates it to
(1.0, 0.5). GLSL matrices are column-major, so translation goes in the third
column. You can pass this matrix as a uniform to animate the whole scene without
regenerating its code.

The matrix maps scene coordinates into the coordinates used by `p`. Both functions
apply its inverse internally. Use an affine matrix with a bottom row of
`(0, 0, 1)`. Uniform scaling preserves distance values and scales strokes too.
Nonuniform scaling and shear give a conservative distance bound; a singular
matrix gives an empty result.

Finally, we combine the returned color with the background. Since the color is
premultiplied, the formula is `scene.rgb + background * (1.0 - scene.a)`.

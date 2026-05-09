# Donation Tree 3D Model Brief

Create one donation tree model exported as a single GLB file for Three.js, React, and Bolt.

## File

File name:

```text
donation-tree.glb
```

Website location:

```text
public/models/donation-tree.glb
```

## Scene Setup

Use real-world-ish scale:

```text
Units: meters
Tree height: about 5 units tall
Tree base centered at world origin
Ground/root base at Y = 0
Tree grows upward along positive Y
Forward direction: -Z
Apply all transforms before export
```

The model origin should be at the center of the tree base on the ground.

The full model should fit inside roughly:

```text
X: -2.5 to 2.5
Y: 0 to 5.5
Z: -2.5 to 2.5
```

## Required Object Names

Name the main objects like this:

```text
TREE_TRUNK
TREE_ROOTS
TREE_CANOPY
PROGRESS_VINE_01
PROGRESS_VINE_02
PROGRESS_VINE_03
```

Additional donation vines are welcome, but they must follow the same pattern:

```text
PROGRESS_VINE_04
PROGRESS_VINE_05
PROGRESS_VINE_06
```

Every vine that should change color must start with:

```text
PROGRESS_VINE_
```

## Vine Behavior

The vines should physically wrap upward around the tree from the ground toward the canopy.

The donation animation will color the vines based on height:

```text
$0 of $1000 = vines are black
$100 of $1000 = bottom 10% of vines becomes colored
$500 of $1000 = bottom 50% becomes colored
$1000 of $1000 = all vines become colored
```

The vine geometry needs to rise cleanly along the Y axis. The website code reveals color from low Y to high Y.

Do not create baked animations for donation progress. The website code handles the color reveal.

## Materials

Use simple named materials:

```text
MAT_Trunk_Bark
MAT_Roots_Dark
MAT_Canopy_DarkLeaves
MAT_Vine_Black
```

The vines can use `MAT_Vine_Black` in Blender. The website will override the progress vine material in code.

Recommended colors:

```text
Trunk: dark brown
Roots: near black brown
Canopy: very dark green
Vines: black or near black
```

## Geometry Guidelines

Keep the model web-friendly:

```text
Total triangles: ideally under 80k, max around 120k
No heavy particle systems unless converted to mesh
No procedural nodes that require Blender at runtime
Apply modifiers before export, unless they export reliably to GLB
Use separate mesh objects for trunk, canopy, roots, and progress vines
```

For the vines:

```text
Use actual tube/mesh geometry, not just curves, unless curves are converted to mesh before export.
Each vine should be one continuous upward path if possible.
Avoid vine parts that go downward for long stretches, because the website reveal is height-based.
```

## Export Settings

Export as:

```text
Format: glTF Binary (.glb)
Include: Selected Objects
Transform: default glTF export is fine
Apply Modifiers: Yes
Materials: Export
Animation: Off, unless there are idle ambient animations separate from donation progress
Compression: Draco optional, but not required
```

## Naming Summary

The website code will look for objects named:

```text
PROGRESS_VINE_01
PROGRESS_VINE_02
PROGRESS_VINE_03
```

Or any object whose name starts with:

```text
PROGRESS_VINE_
```

Those are the only meshes that should receive the donation-progress color reveal.

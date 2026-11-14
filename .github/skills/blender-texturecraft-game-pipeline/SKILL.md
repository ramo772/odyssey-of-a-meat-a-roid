---
name: blender-texturecraft-game-pipeline
description: Plan and validate game-ready 3D assets from Blender modeling through TextureCraft-style PBR texturing, runtime export, and in-engine review. Use for modular environments, props, vehicles, materials, GLB delivery, or asset optimization; do not use for standalone renders with no runtime requirements.
---

# Blender TextureCraft Game Pipeline

Turn an approved art target into reusable, performant game assets. Treat Blender as the editable geometry source, a texture authoring tool such as TextureCraft as the PBR material source, and the real game runtime as the final quality gate.

## Before production

- Read the project art direction, asset manifest, runtime conventions, and platform budget.
- Define the asset's gameplay role, camera distance, scale, pivot, axes, collision needs, animation needs, LODs, texture budget, and delivery format.
- Confirm tool availability. If Blender or the texture tool is unavailable, create a handoff brief instead of pretending the asset was produced or verified.
- Preserve source and license information for references, generated inputs, textures, and third-party assets.

## Pipeline

1. Approve a greybox or representative style target before producing an asset family.
2. Model primary and secondary forms at the correct scale. Prefer reusable modular pieces and non-destructive construction where they improve iteration.
3. Set meaningful origins, pivots, socket markers, naming, collections, and simplified collision proxies.
4. Inspect topology, normals, hidden faces, deformation needs, and silhouette at gameplay distance. Do not infer production quality from a render.
5. UV unwrap with consistent texel density and deliberate seams. Plan shared trim sheets, atlases, or reusable materials before creating unique texture sets.
6. Author or import PBR maps with a documented channel convention: base color, roughness, metallic, normal, ambient occlusion, and emissive only where needed. Avoid baked lighting in base color unless the art direction requires it.
7. Validate color spaces, normal orientation, channel packing, seams, compression, and material reuse in Blender and again in the target renderer.
8. Create LODs and instance repeated geometry. Remove unseen complexity only after checking gameplay cameras and lighting.
9. Export the runtime format—GLB/glTF by default when supported—while retaining editable `.blend` and texture sources separately. Verify transforms, axes, pivots, animation names, materials, and collisions.
10. Load the asset in the real game, inspect representative screenshots, and measure memory, draw calls, load time, and frame impact against the project's budget.

## Modular world rules

- Establish one grid and snap convention per kit.
- Build a minimum viable kit before unique hero pieces.
- Test a closed room, corner, junction, doorway, and representative vista for gaps and scale.
- Use environment storytelling to support the approved narrative; do not invent story canon through props or damage.
- Keep visual references separate from scientific or engineering evidence.

## Completion report

Report source files, runtime files, material and texture sets, polygon and material counts, LODs, collision method, license/provenance, runtime screenshots, measured performance, known limitations, and any unverified step. Never label an asset game-ready without in-runtime validation.

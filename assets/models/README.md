# /assets/models/

Drop a Draco-compressed glTF of the DOVA module here to activate the bespoke 3D hero.

## Required filename

- `dova-module.glb`

## What happens if absent

The hero scene falls back to the procedural OBD-II port and chamfered-box module that ships today. No errors, no broken state, no UI degradation.

## Recommended specs

- Format: glTF 2.0 binary (.glb)
- Geometry compression: Draco (compression level 7)
- Texture compression: KTX2 if available, otherwise PNG (max 1024 x 1024)
- Triangle count: under 30,000 for the module, under 80,000 if a vehicle dashboard is bundled in
- Total file size budget: under 800 KB compressed

## Tier A (free) generation path

Use Spline (free tier at spline.design) to model the DOVA module. Export as glTF. Run through gltf-transform Draco compression. Free CLI.

```
npm install -g @gltf-transform/cli
gltf-transform draco source.glb dova-module.glb
```

## Tier B (paid) contractor path

A Blender artist can produce a photorealistic version for $2k to $5k, lead time 3 to 5 days. The output replaces this file with no code change.

The hero-scene.js loader probes /assets/models/dova-module.glb on every page load. If 200 OK, it swaps the procedural module out for the bespoke one with zero downtime.
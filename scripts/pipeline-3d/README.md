# DOVA 3D asset pipeline (local, free, GPU-only)

Generates the `dova-module.glb` for the immersive hero. Runs entirely on a local GPU. Zero paid services.

## Stack

- **Hunyuan3D 2.1** (Tencent, Apache 2.0) - primary engine, two-stage geometry + PBR
- **Unique3D** (AiuniAI, Apache 2.0) - fast iteration fallback
- **Blender 4.x** headless - decimation, Draco compression, KTX2 textures
- **Google AI Studio Veo / Gemini Image** - free, generates the orthographic reference plates

## Run order

```
01 probe-gpu.ps1            check GPU model + VRAM + Python + Blender
02 bootstrap.ps1            clone Hunyuan3D 2.1, install deps, download weights
03 generate-prompts.md      paste these into Google AI Studio to make the 4 ref plates
04 generate-glb.ps1         turn the 4 plates into a candidate .glb
05 cleanup-blender.py       decimate + bake + Draco + KTX2 export
06 validate.ps1             confirm file size, tri count, loads cleanly
07 promote-to-live.ps1      gated move from candidates/ to /assets/models/dova-module.glb
```

## Constitution reminders

- The render is a public disclosure event. Matthew has signed off on the spec in `02-spec.md`.
- Do NOT push the `.glb` to origin/main until the candidate passes validation AND the screenshot review at the hero scene.
- Voice firewall applies to all files in this pipeline. No em-dashes, no banned vocab.

## Hardware

- Minimum: 8 GB VRAM (Unique3D + Hunyuan3D-mini)
- Recommended: 12 GB VRAM (Hunyuan3D 2.1 full)
- CPU: any modern (AMD Ryzen 5 / Intel i5 8th gen or newer)
- Disk: 30 GB free for model weights + working files

## Output location

Candidate file lands at `assets/models/candidates/dova-module-YYYYMMDD-HHMM.glb`.
Promotion script moves the approved candidate to `assets/models/dova-module.glb`.
The hero loader auto-detects the active slot on next page load.
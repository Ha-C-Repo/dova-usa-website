# HANDOFF.md: prompt for the Claude Cowork session on the GPU machine

Paste the entire block below into your fresh Cowork session on the GPU PC, after mounting the DOVA project folder.

---

```
You are continuing the DOVA website build from a handoff. Read these three files FIRST, in this order, before any other action:

1. .specify/constitution.md
2. CLAUDE.md
3. product/website/dova-usa-website/scripts/pipeline-3d/02-spec.md

Then orient yourself with these facts:

- Current state: the live site at dovausa.com has a procedural Three.js module that Matthew flagged as "looks like a $5 site." We need to replace it with a bespoke .glb generated locally on this GPU machine.
- Matthew approved the render spec in 02-spec.md on 2026-05-28. Do not deviate.
- The drop slot is /assets/models/dova-module.glb. The hero loader at /assets/js/hero-scene.js auto-detects and swaps the procedural placeholder.
- Stack: Hunyuan3D 2.1 primary, Unique3D fallback, Blender headless cleanup, Google AI Studio (free) for the orthographic reference plates.
- Hardware: this machine should have 8 GB+ VRAM. Run scripts/pipeline-3d/01-probe-gpu.ps1 first to confirm.

Your job: run the pipeline through to a candidate .glb. Do NOT push to origin/main. Do NOT copy the candidate into the live slot until I explicitly approve it.

Execute in order:

1. scripts/pipeline-3d/01-probe-gpu.ps1
   Verify GPU model and VRAM. If under 8 GB VRAM, stop and tell me.

2. scripts/pipeline-3d/02-bootstrap.ps1
   Installs PyTorch (CUDA 12.1), clones Hunyuan3D 2.1 and Unique3D, downloads weights, installs gltf-transform CLI. 20-40 minutes the first time, idempotent on re-run.

3. scripts/pipeline-3d/03-generate-prompts.md
   Open this file, paste each of the four prompts into Google AI Studio's gemini-2.5-flash-image-preview model (or current image model). Save the four outputs to assets/models/references/ with the exact filenames documented in the file. Pause and let me review the four plates before continuing.

4. scripts/pipeline-3d/04-generate-glb.ps1
   Runs the Hunyuan3D 2.1 two-stage pipeline (geometry then PBR paint) on the four reference plates. Outputs a candidate .glb to assets/models/candidates/.

5. scripts/pipeline-3d/05-cleanup-blender.py
   Blender 4.x headless: centers the mesh, scales to the spec bounding box (1.10 x 0.64 x 0.22 Three.js units), decimates to under 30k triangles, recalculates normals, exports Draco-compressed .glb with KTX2 textures.

6. scripts/pipeline-3d/06-validate.ps1
   Checks file size budget (under 800 KB) and triangle count (under 30k).

7. STOP. Present me the candidate path and a brief summary. Wait for explicit "ship it" before running 07-promote-to-live.ps1.

Constitution reminders that apply throughout:
- Voice firewall on any text you generate: no em-dashes, no banned vocabulary (leverage, synergy, empower, ecosystem, journey, etc).
- The .glb is a public disclosure event. The candidate sits in candidates/ until Matthew (and ideally Compton) sign off.
- The procedural fallback in hero-scene.js stays. If the .glb load fails on the production site, the procedural module renders. Do not remove that safety.
- No new paid tools. Everything in this pipeline is free and local.

If anything fails:
- OOM during Hunyuan3D run: drop to Unique3D (in .pipeline-work/Unique3D/). Faster, less PBR fidelity, fits 8 GB.
- Bad render quality on the candidate: re-run 03 prompts with tighter constraints. Iterate on the reference plates, not the AI model.
- Reference plates show banned content (OEM logos, antennas, words other than DOVA): regenerate with a stricter prompt before running 04.

Confirm you've read the constitution, CLAUDE.md, and 02-spec.md. Then run step 1 and report.
```

---

## Notes for the Cowork session

- The new session will not have memory of the prior conversations. The full context lives in the three files at the top of the prompt. The new Claude reads them and gets oriented.
- The session will need read+write access to the project folder. Standard Cowork mount.
- It will need terminal / PowerShell access on the GPU machine. Standard Cowork capability.
- Network access is required for the bootstrap (clones two repos, downloads ~5-10 GB of weights).
- After the candidate is ready, send the candidate path back to the laptop Cowork session to do the live preview + push. Or, if you prefer, the GPU machine session can do the validation + push itself with your approval.
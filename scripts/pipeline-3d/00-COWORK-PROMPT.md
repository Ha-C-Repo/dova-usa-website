You are continuing the DOVA website build from a hand-off. This is a fresh Cowork session on a Windows machine with an NVIDIA GPU. The previous session ran on a laptop with no GPU and built the entire 3D asset pipeline up to the point of needing a GPU to execute.

Your scope: produce one bespoke .glb of the DOVA hardware module and stage it for review. Do NOT push it to the live site. Do NOT promote the candidate to the active slot. Stop and wait for human approval before either of those.

Read these three files first, in this order, before any other action:

1. .specify/constitution.md (absolute anchor for the venture)
2. CLAUDE.md (project rules and routing)
3. product/website/dova-usa-website/scripts/pipeline-3d/02-spec.md (the locked render spec that Matthew approved on 2026-05-28)

Then orient yourself with these facts:

Background. The DOVA website lives at https://dovausa.com. The hero is an immersive Three.js scene that currently renders a procedural box-and-cylinder approximation of the module. Matthew reviewed it and said it "looks like a $5 site rather than a $50K site." The fix is to replace the procedural geometry with a real bespoke .glb. The loader is already wired: drop a valid file at product/website/dova-usa-website/assets/models/dova-module.glb and the hero swaps it in automatically on next page load. The procedural module stays as a fallback if the .glb fails to load. There is no risk of breaking the live site by adding the .glb.

Stack you will use. Hunyuan3D 2.1 (Tencent, Apache 2.0) is the primary engine, two-stage geometry plus PBR texture synthesis. Unique3D (AiuniAI, Apache 2.0) is the fallback for low-VRAM machines or fast iteration. Blender 4.x headless handles cleanup, decimation, and Draco plus KTX2 compression. Google AI Studio Gemini Image (free, in our paid stack via Google Premium) generates the four orthographic reference plates that feed the AI pipeline. All four pieces are free. No new paid tools.

Constraints that override any instinct you have:

- Voice firewall. Anything you write to disk respects skills/dova-voice.md. No em-dashes. No banned vocabulary (leverage, synergy, empower, game-changing, deep dive, ecosystem, journey, in essence, that is where, it is not just). Run scripts/build-checks.sh against any HTML you might touch.
- IP disclosure boundary. The .glb is a public disclosure event. No claim text, no FTO findings, no patent numbers visible in the model. No OEM logos, no vehicle make markings, no antennas, no readable text other than the engraved "DOVA" wordmark on the top face. The spec in 02-spec.md lists required absences explicitly.
- No new paid subscriptions. The pipeline is free end to end.
- Do not edit hero-scene.js. The loader pre-wired in Phase 4h already detects and swaps in the .glb.

Execute in order:

1. Run scripts/pipeline-3d/01-probe-gpu.ps1. Report the GPU model and VRAM. If under 8 GB VRAM, stop and tell me. The pipeline cannot finish on 4 to 6 GB cards.

2. Run scripts/pipeline-3d/02-bootstrap.ps1. This creates a Python venv, installs PyTorch with CUDA 12.1, clones Hunyuan3D 2.1 and Unique3D, downloads the model weights (4 to 10 GB on disk), and installs the gltf-transform CLI. First run takes 20 to 40 minutes depending on network. Idempotent on re-run. Confirm the final smoke test prints "CUDA: True" and the GPU name.

3. Open scripts/pipeline-3d/03-generate-prompts.md and walk me through it. The file contains four prompts for Google AI Studio gemini-2.5-flash-image-preview. I run those prompts manually in my browser and save the four outputs to assets/models/references/ with the exact filenames documented (dova-module-3q.png, dova-module-top.png, dova-module-front.png, dova-module-side.png). Pause and let me confirm all four plates are saved before continuing. Inspect each one against 02-spec.md before signing off: any plate showing OEM logos, antennas, vehicle markings, or text other than DOVA must be regenerated, not used.

4. Run scripts/pipeline-3d/04-generate-glb.ps1. This runs the Hunyuan3D 2.1 two-stage pipeline (Hunyuan3D-DiT for geometry, Hunyuan3D-Paint for PBR textures) on the four reference plates and writes a candidate file to assets/models/candidates/dova-module-painted-TIMESTAMP.glb. If the script OOMs on this machine's VRAM, fall back to running Unique3D in .pipeline-work/Unique3D/ instead. Report which engine succeeded.

5. Run blender --background --python scripts/pipeline-3d/05-cleanup-blender.py -- INPUT_PATH OUTPUT_PATH. This centers the mesh, scales it to the locked bounding box (1.10 x 0.64 x 0.22 Three.js units), decimates to under 30,000 triangles, recalculates normals, and exports a Draco-compressed glb with KTX2 textures. The output is the candidate that will be reviewed.

6. Run scripts/pipeline-3d/06-validate.ps1 on the cleaned candidate. Confirm the file size is under 800 KB and the triangle count is under 30,000. If either gate fails, return to step 5 with tighter decimation parameters or step 3 with simpler reference plates.

7. Stop. Output:
   - The candidate path
   - The validate.ps1 result
   - A one-paragraph quality assessment (does it match the spec, are there visible defects, would you ship it)
   - A reminder that I (or the laptop Cowork session) need to preview the candidate in the live hero scene before promoting

8. Do NOT run scripts/pipeline-3d/07-promote-to-live.ps1 until I send the explicit phrase "ship it" or "promote to live" in chat. That script requires three y-confirmations (Matthew reviewed, Compton cleared, live preview done) and overwrites assets/models/dova-module.glb. The procedural fallback in hero-scene.js stays in either path.

If anything fails on your end:

- Bootstrap fails on torch+CUDA install: the GPU likely needs a newer driver. Run nvidia-smi to confirm the driver version, then re-run 02-bootstrap.ps1.
- Hunyuan3D OOMs at run time: fall back to Unique3D in .pipeline-work/Unique3D/. Lower quality but fits 6 to 8 GB cards.
- Blender script can't find blender.exe: the cleanup is the last automated step. Install Blender 4.x from blender.org and re-run, OR open the candidate manually in Blender, run the script via Edit > Operator Search > Run Script.
- gltf-transform inspect fails: npm install -g @gltf-transform/cli, then re-run.

Now confirm you have read the three orientation files. Run 01-probe-gpu.ps1 and report the GPU. Then ask me before running 02-bootstrap.ps1, because the bootstrap downloads many gigabytes of model weights and I want to confirm the disk has room and the network is OK before you start.
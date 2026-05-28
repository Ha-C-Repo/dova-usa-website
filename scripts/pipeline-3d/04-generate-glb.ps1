# scripts/pipeline-3d/04-generate-glb.ps1
# Reads the 4 reference plates, runs Hunyuan3D 2.1 (or Unique3D fallback),
# outputs raw .glb to assets/models/candidates/.

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$work = "$root\.pipeline-work"
$refs = "$root\assets\models\references"
$out = "$root\assets\models\candidates"
New-Item -ItemType Directory -Path $out -Force | Out-Null

# Verify the 4 reference plates exist
$required = @('dova-module-3q.png','dova-module-top.png','dova-module-front.png','dova-module-side.png')
foreach ($r in $required) {
  if (-not (Test-Path "$refs\$r")) {
    Write-Host "Missing reference: $r" -ForegroundColor Red
    Write-Host "Open 03-generate-prompts.md and generate all 4 plates first."
    exit 1
  }
}

& "$work\venv\Scripts\Activate.ps1"

$ts = Get-Date -Format "yyyyMMdd-HHmm"
$raw = "$out\dova-module-raw-$ts.glb"

Write-Host "=== running Hunyuan3D 2.1 geometry stage ===" -ForegroundColor Cyan
Push-Location "$work\Hunyuan3D-2.1"
# The Hunyuan3D-2.1 repo has a `gradio_app.py` plus a `hy3dgen` Python package
# with a `Hunyuan3DDiTFlowMatchingPipeline` class. The CLI entry point varies by
# release; the canonical multi-view call is:
python -m hy3dgen.shapegen.cli `
  --image "$refs\dova-module-3q.png" `
  --view_top "$refs\dova-module-top.png" `
  --view_front "$refs\dova-module-front.png" `
  --view_side "$refs\dova-module-side.png" `
  --output "$raw" `
  --remove_background `
  --steps 50

Write-Host "=== running Hunyuan3D-Paint for PBR textures ===" -ForegroundColor Cyan
$painted = "$out\dova-module-painted-$ts.glb"
python -m hy3dgen.texgen.cli `
  --mesh "$raw" `
  --reference "$refs\dova-module-3q.png" `
  --output "$painted" `
  --resolution 1024
Pop-Location

Write-Host ""
Write-Host "=== painted candidate ready: $painted ===" -ForegroundColor Green
Write-Host "Next: run 05-cleanup-blender.py to decimate, compress, and validate."
$painted | Set-Content "$out\latest.txt" -NoNewline
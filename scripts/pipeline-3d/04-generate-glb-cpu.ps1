# scripts/pipeline-3d/04-generate-glb-cpu.ps1
# CPU TripoSR run. Reads the three-quarter reference plate from
# assets/models/references/ and writes a raw GLB to
# assets/models/candidates/ with a timestamp.
# TripoSR accepts a single image, the 3q view is the primary.
# The other three plates (top, front, side) are kept on disk for
# downstream Blender-side detail validation, not for engine input.

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$work = "$root\.pipeline-work"
$refs = "$root\assets\models\references"
$out  = "$root\assets\models\candidates"
New-Item -ItemType Directory -Path $out -Force | Out-Null

# Verify the primary reference plate exists
$primary = "$refs\dova-module-3q.png"
if (-not (Test-Path $primary)) {
  Write-Host "Missing reference: $primary" -ForegroundColor Red
  Write-Host "Run Phase 3 (Runway) and save the three-quarter plate first."
  exit 1
}

& "$work\venv-cpu\Scripts\Activate.ps1"

$ts = Get-Date -Format "yyyyMMdd-HHmm"
$rawDir = "$out\triposr-$ts"
New-Item -ItemType Directory -Path $rawDir -Force | Out-Null

Write-Host "=== running TripoSR on CPU (this takes 2 to 10 minutes) ===" -ForegroundColor Cyan
Push-Location "$work\TripoSR"
python run.py `
  "$primary" `
  --output-dir "$rawDir" `
  --device cpu `
  --model-save-format glb `
  --foreground-ratio 0.85 `
  --mc-resolution 256
Pop-Location

# TripoSR writes <output-dir>/0/mesh.glb (single-image runs produce a single subfolder)
$generated = Get-ChildItem -Path $rawDir -Recurse -Filter "mesh.glb" | Select-Object -First 1
if (-not $generated) {
  Write-Host "TripoSR did not produce mesh.glb. Check $rawDir for errors." -ForegroundColor Red
  exit 1
}

$raw = "$out\dova-module-raw-$ts.glb"
Copy-Item $generated.FullName $raw -Force

Write-Host ""
Write-Host "=== raw candidate ready: $raw ===" -ForegroundColor Green
Write-Host "Next: run 05-cleanup-blender.py to scale, decimate, and Draco-compress."
$raw | Set-Content "$out\latest.txt" -NoNewline

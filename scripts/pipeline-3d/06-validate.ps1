# scripts/pipeline-3d/06-validate.ps1
# Validates a candidate .glb against the locked spec.
# Usage: .\06-validate.ps1 path\to\candidate.glb

param([string]$Path = "")
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path

if (-not $Path) {
  $latest = Get-Content "$root\assets\models\candidates\latest.txt" -ErrorAction SilentlyContinue
  if ($latest) { $Path = $latest } else {
    Write-Host "Provide a path or run 04-generate-glb.ps1 first." -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-Path $Path)) {
  Write-Host "File not found: $Path" -ForegroundColor Red
  exit 1
}

$size = (Get-Item $Path).Length
$sizeKB = [math]::Round($size / 1024, 1)
Write-Host "Candidate: $Path"
Write-Host "  Size: $sizeKB KB ($(if ($sizeKB -le 800) {'PASS'} else {'FAIL'} - budget 800)"

# gltf-transform inspect for triangle count + texture info
if (Get-Command gltf-transform -ErrorAction SilentlyContinue) {
  Write-Host ""
  Write-Host "=== gltf-transform inspect ==="
  gltf-transform inspect $Path
} else {
  Write-Host "gltf-transform CLI not installed. Run: npm install -g @gltf-transform/cli" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next step: copy candidate to /assets/models/candidates/ and open"
Write-Host "  https://dovausa.com/?model_test=1 in your browser (local serve recommended)"
Write-Host "to preview the model in the live hero scene before promoting."
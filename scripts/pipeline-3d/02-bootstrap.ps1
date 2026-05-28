# scripts/pipeline-3d/02-bootstrap.ps1
# One-time setup on the GPU machine. Idempotent: safe to re-run.
# Estimated time: 20-40 min depending on network speed (4-12 GB of weights).

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$work = "$root\.pipeline-work"
New-Item -ItemType Directory -Path $work -Force | Out-Null

Write-Host "=== creating Python venv ===" -ForegroundColor Cyan
if (-not (Test-Path "$work\venv")) {
  python -m venv "$work\venv"
}
& "$work\venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip setuptools wheel | Out-Null

Write-Host "=== installing PyTorch (CUDA 12.1 build) ===" -ForegroundColor Cyan
pip install --extra-index-url https://download.pytorch.org/whl/cu121 torch torchvision

Write-Host "=== cloning Hunyuan3D 2.1 ===" -ForegroundColor Cyan
if (-not (Test-Path "$work\Hunyuan3D-2.1")) {
  git clone --depth 1 https://github.com/Tencent-Hunyuan/Hunyuan3D-2.1.git "$work\Hunyuan3D-2.1"
}
Push-Location "$work\Hunyuan3D-2.1"
pip install -r requirements.txt
Pop-Location

Write-Host "=== cloning Unique3D (fallback engine) ===" -ForegroundColor Cyan
if (-not (Test-Path "$work\Unique3D")) {
  git clone --depth 1 https://github.com/AiuniAI/Unique3D.git "$work\Unique3D"
}
Push-Location "$work\Unique3D"
pip install -r requirements.txt
Pop-Location

Write-Host "=== installing glTF tooling for cleanup pass ===" -ForegroundColor Cyan
npm install -g @gltf-transform/cli

Write-Host ""
Write-Host "=== smoke test: load Hunyuan3D imports ===" -ForegroundColor Green
python -c "import torch; print('CUDA:', torch.cuda.is_available(), torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'no GPU')"

Write-Host ""
Write-Host "Setup complete. Next: open 03-generate-prompts.md, generate the 4 plates, then run 04-generate-glb.ps1."
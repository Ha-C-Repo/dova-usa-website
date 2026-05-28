# scripts/pipeline-3d/02-bootstrap-cpu.ps1
# CPU-only bootstrap for hardware without a CUDA NVIDIA GPU.
# Targets the AMD Radeon RX 6500 XT / Ryzen workstation. Uses Python 3.11
# alongside the system 3.13 (which Nano Cube bid estimating depends on).
# Engine: TripoSR (VAST-AI, MIT license, CPU path documented).
# Estimated time on first run: 10 to 20 minutes of pip installs and a
# ~1 GB TripoSR weight download on first inference.
# Idempotent. Safe to re-run.

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path
$work = "$root\.pipeline-work"
New-Item -ItemType Directory -Path $work -Force | Out-Null

Write-Host "=== verifying Python 3.11 is present ===" -ForegroundColor Cyan
$py311 = (& py -3.11 -c "import sys; print(sys.executable)") 2>$null
if (-not $py311) {
  Write-Host "Python 3.11 not found. Install with: winget install --id Python.Python.3.11" -ForegroundColor Red
  exit 1
}
Write-Host "Python 3.11 at: $py311"

Write-Host "=== creating venv-cpu on Python 3.11 ===" -ForegroundColor Cyan
if (-not (Test-Path "$work\venv-cpu")) {
  & py -3.11 -m venv "$work\venv-cpu"
}
& "$work\venv-cpu\Scripts\Activate.ps1"
python -m pip install --upgrade pip setuptools wheel | Out-Null

Write-Host "=== installing PyTorch CPU wheels ===" -ForegroundColor Cyan
pip install --index-url https://download.pytorch.org/whl/cpu torch==2.3.1 torchvision==0.18.1

Write-Host "=== cloning TripoSR ===" -ForegroundColor Cyan
if (-not (Test-Path "$work\TripoSR")) {
  git clone --depth 1 https://github.com/VAST-AI-Research/TripoSR.git "$work\TripoSR"
}

Write-Host "=== installing TripoSR requirements (CPU-safe) ===" -ForegroundColor Cyan
Push-Location "$work\TripoSR"
# Patch requirements: drop xformers (CUDA-only) and torchmcubes-gpu if present.
$req = Get-Content requirements.txt
$reqClean = $req | Where-Object { $_ -notmatch '^xformers' -and $_ -notmatch 'torchmcubes-cuda' }
$reqClean | Set-Content requirements-cpu.txt
pip install -r requirements-cpu.txt
# torchmcubes CPU build for marching cubes (TripoSR needs it):
pip install git+https://github.com/tatsy/torchmcubes.git
Pop-Location

Write-Host "=== installing glTF tooling for cleanup pass ===" -ForegroundColor Cyan
$nodeOk = $null -ne (Get-Command npm -ErrorAction SilentlyContinue)
if ($nodeOk) {
  npm install -g "@gltf-transform/cli" 2>&1 | Out-Null
  Write-Host "gltf-transform CLI installed."
} else {
  Write-Host "Node/npm not detected. Validation step will skip gltf-transform inspect." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== smoke test ===" -ForegroundColor Green
python -c "import torch; print('Torch:', torch.__version__); print('CUDA:', torch.cuda.is_available()); print('Threads:', torch.get_num_threads())"
python -c "import sys; sys.path.insert(0, r'$work\TripoSR'); from tsr.system import TSR; print('TripoSR import: OK')"

Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Next: confirm Runway plates are in assets/models/references/, then run 04-generate-glb-cpu.ps1."

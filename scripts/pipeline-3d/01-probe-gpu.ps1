# scripts/pipeline-3d/01-probe-gpu.ps1
# Reports GPU model, VRAM, CUDA availability, Python, Blender presence.
# Runs in < 5 seconds. No installs, no downloads.

Write-Host "=== GPU ===" -ForegroundColor Cyan
Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion | Format-List

Write-Host "=== CUDA / nvidia-smi ===" -ForegroundColor Cyan
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
  nvidia-smi --query-gpu=name,memory.total,memory.free,driver_version,cuda_version --format=csv
} else {
  Write-Host "nvidia-smi not found. Install NVIDIA driver bundle first." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Python ===" -ForegroundColor Cyan
if (Get-Command python -ErrorAction SilentlyContinue) {
  python --version
  Write-Host "  pip: $(pip --version)"
} else {
  Write-Host "Python not found. Install Python 3.11 from python.org (check 'Add to PATH')." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Git ===" -ForegroundColor Cyan
if (Get-Command git -ErrorAction SilentlyContinue) { git --version } else { Write-Host "Install Git for Windows." -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== Blender ===" -ForegroundColor Cyan
$blender = @(
  "C:\Program Files\Blender Foundation\Blender 4.2\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.1\blender.exe",
  "C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($blender) {
  Write-Host "  found: $blender"
  & $blender --version | Select-Object -First 1
} else {
  Write-Host "Blender not found. Install Blender 4.x from blender.org (free)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Recommendation ===" -ForegroundColor Green
$gpu = Get-CimInstance Win32_VideoController | Where-Object { $_.AdapterRAM -gt 4GB } | Select-Object -First 1
if ($gpu) {
  $vramGB = [math]::Round($gpu.AdapterRAM / 1GB, 1)
  Write-Host ("  Detected: {0} with {1} GB" -f $gpu.Name, $vramGB)
  if ($vramGB -ge 12) {
    Write-Host "  -> Use Hunyuan3D 2.1 full pipeline (geometry + PBR paint)" -ForegroundColor Green
  } elseif ($vramGB -ge 8) {
    Write-Host "  -> Use Hunyuan3D 2.1 mini OR Unique3D (Hunyuan full may OOM)" -ForegroundColor Yellow
  } else {
    Write-Host "  -> Use Unique3D only. Hunyuan will OOM at this VRAM." -ForegroundColor Yellow
  }
}
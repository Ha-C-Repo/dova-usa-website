# scripts/pipeline-3d/07-promote-to-live.ps1
# Promotes an approved candidate to the live slot. Prompts for confirmation.
# Constitution gate: requires confirmation that Matthew + Compton have reviewed.

param([string]$Candidate = "")
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path "$PSScriptRoot\..\..").Path

if (-not $Candidate) {
  $latest = Get-Content "$root\assets\models\candidates\latest.txt" -ErrorAction SilentlyContinue
  if ($latest) { $Candidate = $latest } else {
    Write-Host "Provide a candidate path or set assets\models\candidates\latest.txt" -ForegroundColor Red
    exit 1
  }
}

if (-not (Test-Path $Candidate)) {
  Write-Host "Candidate not found: $Candidate" -ForegroundColor Red
  exit 1
}

Write-Host "=== About to promote ==="
Write-Host "  From: $Candidate"
Write-Host "  To:   $root\assets\models\dova-module.glb"
Write-Host ""
Write-Host "Constitution gate (per .specify\constitution.md):" -ForegroundColor Yellow
Write-Host "  - Has Matthew reviewed the candidate render? [y/N]"
$mt = Read-Host
if ($mt -ne 'y' -and $mt -ne 'Y') { Write-Host "Aborted."; exit 1 }
Write-Host "  - Has Compton (or his designee) cleared the public disclosure level? [y/N]"
$ct = Read-Host
if ($ct -ne 'y' -and $ct -ne 'Y') { Write-Host "Aborted."; exit 1 }
Write-Host "  - Has the candidate been previewed in the live hero scene? [y/N]"
$pv = Read-Host
if ($pv -ne 'y' -and $pv -ne 'Y') { Write-Host "Aborted."; exit 1 }

# Backup any existing live file
$liveTarget = "$root\assets\models\dova-module.glb"
if (Test-Path $liveTarget) {
  $ts = Get-Date -Format "yyyyMMdd-HHmm"
  $backup = "$root\assets\models\candidates\dova-module-replaced-$ts.glb"
  Copy-Item $liveTarget $backup
  Write-Host "Backed up previous live to: $backup"
}

Copy-Item $Candidate $liveTarget -Force
Write-Host "Promoted to live: $liveTarget" -ForegroundColor Green
Write-Host ""
Write-Host "Next: git add, commit with the constitution-checked message, and push."
Write-Host "Suggested commit: 'Phase 5.7: ship bespoke DOVA module .glb (procedural -> real geometry)'"
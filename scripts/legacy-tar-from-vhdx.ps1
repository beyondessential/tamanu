<#
.SYNOPSIS
  Derive the legacy Windows release tar from a finished (detached) VHDX by
  mounting it and tarring its release tree out — no second npm install.

.DESCRIPTION
  Uses Mount-DiskImage (Storage module, no Hyper-V) rather than diskpart:
  attaching an *existing* VHDX with diskpart leaves no partition selected, so
  `assign mount=` fails (E_INVALIDARG). Mount-DiskImage auto-mounts the existing
  NTFS volume to a drive letter, which we tar from, then dismount.

.PARAMETER Vhdx
  Path to the finished VHDX (raw, not yet compressed).

.PARAMETER ReleaseName
  Top-level directory on the volume to archive, e.g. release-v2.60.0.

.PARAMETER OutTar
  Output .tar path (uncompressed; caller compresses).
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Vhdx,
  [Parameter(Mandatory)][string]$ReleaseName,
  [Parameter(Mandatory)][string]$OutTar
)

$ErrorActionPreference = 'Stop'
$vhdxFull = (Resolve-Path -LiteralPath $Vhdx).Path

Mount-DiskImage -ImagePath $vhdxFull -StorageType VHDX | Out-Null
try {
  # The existing NTFS volume auto-mounts; wait for its drive letter to appear.
  $letter = $null
  for ($i = 0; $i -lt 30 -and -not $letter; $i++) {
    Start-Sleep -Milliseconds 500
    $letter = (Get-DiskImage -ImagePath $vhdxFull | Get-Disk | Get-Partition |
      Get-Volume | Where-Object { $_.DriveLetter }).DriveLetter
  }
  if (-not $letter) { throw "mounted VHDX exposed no drive letter" }

  # bsdtar the release tree straight off the mounted volume.
  tar -cf $OutTar -C "${letter}:\" $ReleaseName
  if ($LASTEXITCODE -ne 0) { throw "tar failed ($LASTEXITCODE)" }
  Write-Host "Derived $OutTar from $vhdxFull (drive ${letter}:)"
} finally {
  Dismount-DiskImage -ImagePath $vhdxFull | Out-Null
}

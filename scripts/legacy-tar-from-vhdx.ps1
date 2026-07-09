<#
.SYNOPSIS
  Derive the legacy Windows release tar from a finished (detached) VHDX by
  mounting it read-only and tarring its release tree out — no second npm install.

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
$tmp = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [System.IO.Path]::GetTempPath() }

$mount = Join-Path $tmp ("legacymnt-" + [guid]::NewGuid().ToString('N'))
if (Test-Path $mount) { Remove-Item -Recurse -Force $mount }
New-Item -ItemType Directory -Force -Path $mount | Out-Null

function Invoke-Diskpart([string]$script, [string]$name) {
  $file = Join-Path $tmp $name
  $script | Set-Content -Encoding Ascii -Path $file
  diskpart /s $file | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "diskpart ($name) failed ($LASTEXITCODE)" }
}

try {
  Invoke-Diskpart @"
select vdisk file="$vhdxFull"
attach vdisk readonly
assign mount="$mount"
"@ 'legacy-attach.txt'

  # bsdtar the release tree straight out of the read-only mount.
  tar -cf $OutTar -C $mount $ReleaseName
  if ($LASTEXITCODE -ne 0) { throw "tar failed ($LASTEXITCODE)" }
} finally {
  Invoke-Diskpart @"
select vdisk file="$vhdxFull"
detach vdisk
"@ 'legacy-detach.txt'
  Remove-Item -Recurse -Force $mount -ErrorAction SilentlyContinue
}

Write-Host "Derived $OutTar from $vhdxFull"

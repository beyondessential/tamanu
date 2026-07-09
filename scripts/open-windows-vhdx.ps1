<#
.SYNOPSIS
  Create an empty, dynamically-sized VHDX, format it, and mount it at a given
  directory — so a build can write *directly* into the disk image (see the
  windows-vhdx job's direct-build experiment in cd.yml).

.DESCRIPTION
  Companion to close-windows-vhdx.ps1 (which detaches it). Unlike
  build-windows-vhdx.ps1 (which formats + copies a finished tree in), this
  leaves the volume mounted and empty for the caller to populate in place.

.PARAMETER Output
  Path to write the VHDX image to.

.PARAMETER SizeMB
  Virtual size in MiB. VHDX is expandable, so the on-disk file only grows to
  the data actually written; oversize freely to leave build headroom.

.PARAMETER Mount
  Empty directory to mount the volume at (created if missing).

.PARAMETER Filesystem
  NTFS (default) or ReFS.

.PARAMETER Label
  Volume label (default: Tamanu). Sanitised to [A-Za-z0-9_-].

.PARAMETER Compress
  Enable transparent NTFS compression on the volume root before it is
  populated, so files written into it inherit compression. Ignored on ReFS.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Output,
  [Parameter(Mandatory)][int]$SizeMB,
  [Parameter(Mandatory)][string]$Mount,
  [ValidateSet('NTFS', 'ReFS')][string]$Filesystem = 'NTFS',
  [string]$Label = 'Tamanu',
  [switch]$Compress
)

$ErrorActionPreference = 'Stop'

if ($Compress -and $Filesystem -eq 'ReFS') {
  Write-Warning "ReFS does not support NTFS-style compression on this OS; ignoring -Compress"
  $Compress = $false
}

$Label = ($Label -replace '[^A-Za-z0-9_-]', '-')
if ($Label.Length -gt 32) { $Label = $Label.Substring(0, 32) }

$outDir = Split-Path -Parent $Output
if (-not $outDir) { $outDir = (Get-Location).Path }
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$outFull = Join-Path (Resolve-Path -LiteralPath $outDir).Path (Split-Path -Leaf $Output)
if (Test-Path $outFull) { Remove-Item -Force $outFull }

# Mount must be an existing empty directory.
if (Test-Path $Mount) { Remove-Item -Recurse -Force $Mount }
New-Item -ItemType Directory -Force -Path $Mount | Out-Null

$fsToken = $Filesystem.ToLower()
$createScript = @"
create vdisk file="$outFull" maximum=$SizeMB type=expandable
attach vdisk
create partition primary
format fs=$fsToken quick label="$Label"
assign mount="$Mount"
"@
$createFile = Join-Path $env:RUNNER_TEMP 'diskpart-open.txt'
$createScript | Set-Content -Encoding Ascii -Path $createFile
diskpart /s $createFile
if ($LASTEXITCODE -ne 0) { throw "diskpart open failed ($LASTEXITCODE)" }

if ($Compress) { & compact.exe /C "$Mount" | Out-Null }

Write-Host "Opened $Filesystem VHDX $outFull mounted at $Mount ($SizeMB MiB virtual, compress=$([bool]$Compress))"

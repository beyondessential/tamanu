<#
.SYNOPSIS
  Build a dynamically-sized NTFS VHDX disk image containing a Tamanu Windows
  release bundle, using only native Windows tooling (diskpart + robocopy).

.DESCRIPTION
  Runs on a Windows runner after the bundle has been prepared (server:
  node_modules installed natively + Node runtime embedded; frontend: built dist +
  embedded Caddy). The resulting VHDX holds a runnable Windows bundle and is
  packed as an OCI artifact (see the windows-vhdx / windows-vhdx-frontend jobs in
  cd.yml).

  The disk is created as an expandable (dynamic) VHDX, so the on-disk file only
  grows to the data actually written, not the full virtual size.

.PARAMETER ReleaseDir
  The bundle root. Its whole tree is copied onto the disk under a top-level
  directory of the same name, mirroring the release .tar/.zip layout.

.PARAMETER Output
  Path to write the VHDX image to.

.PARAMETER Label
  Optional volume label (default: Tamanu). Sanitised to [A-Za-z0-9_-].
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$ReleaseDir,
  [Parameter(Mandatory)][string]$Output,
  [string]$Label = 'Tamanu'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -PathType Container $ReleaseDir)) {
  throw "release directory '$ReleaseDir' does not exist"
}

# NTFS labels max out at 32 chars; keep to a safe character set (diskpart's
# scripting is whitespace/quote sensitive).
$Label = ($Label -replace '[^A-Za-z0-9_-]', '-')
if ($Label.Length -gt 32) { $Label = $Label.Substring(0, 32) }

$releaseFull = (Resolve-Path -LiteralPath $ReleaseDir).Path
$releaseName = Split-Path -Leaf $releaseFull

# diskpart needs an absolute VHDX path.
$outDir = Split-Path -Parent $Output
if (-not $outDir) { $outDir = (Get-Location).Path }
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
$outFull = Join-Path (Resolve-Path -LiteralPath $outDir).Path (Split-Path -Leaf $Output)
if (Test-Path $outFull) { Remove-Item -Force $outFull }

# Size the disk from the bundle: +40% for metadata/cluster slack and read-write
# headroom, plus a small floor.
$bytes = (Get-ChildItem -LiteralPath $releaseFull -Recurse -File -Force |
  Measure-Object -Property Length -Sum).Sum
if (-not $bytes) { $bytes = 0 }
$diskMB = [math]::Ceiling($bytes / 1MB * 1.4) + 512
Write-Host "Bundle is $([math]::Ceiling($bytes / 1MB)) MiB; provisioning a $diskMB MiB dynamic NTFS VHDX at $outFull"

# Mount to an empty directory rather than a drive letter, to avoid collisions
# with whatever letters the runner already has in use.
$mountRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [System.IO.Path]::GetTempPath() }
$mount = Join-Path $mountRoot ("vhdxmnt-" + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Force -Path $mount | Out-Null

$createScript = @"
create vdisk file="$outFull" maximum=$diskMB type=expandable
attach vdisk
create partition primary
format fs=ntfs quick label="$Label"
assign mount="$mount"
"@
$createFile = Join-Path $mountRoot 'diskpart-create.txt'
$createScript | Set-Content -Encoding Ascii -Path $createFile
diskpart /s $createFile
if ($LASTEXITCODE -ne 0) { throw "diskpart create failed ($LASTEXITCODE)" }

try {
  $dest = Join-Path $mount $releaseName
  robocopy $releaseFull $dest /E /COPY:DAT /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
  # robocopy exit codes < 8 are success (files copied, extras, etc.).
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
} finally {
  $detachScript = @"
select vdisk file="$outFull"
detach vdisk
"@
  $detachFile = Join-Path $mountRoot 'diskpart-detach.txt'
  $detachScript | Set-Content -Encoding Ascii -Path $detachFile
  diskpart /s $detachFile
  Remove-Item -Recurse -Force $mount -ErrorAction SilentlyContinue
}

$sizeMB = [math]::Round((Get-Item $outFull).Length / 1MB, 1)
Write-Host "Built NTFS VHDX: $outFull ($sizeMB MiB on-disk, $diskMB MiB virtual)"

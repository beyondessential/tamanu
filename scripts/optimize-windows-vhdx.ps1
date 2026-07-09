<#
.SYNOPSIS
  Reclaim unused blocks from a (detached) dynamic VHDX to shrink the on-disk
  file. A native npm install churns huge numbers of temp files; a dynamic VHDX
  keeps those freed blocks allocated until they're TRIMmed and the file compacted.

.DESCRIPTION
  Best-effort, no-Hyper-V-required pipeline:
    1. Attach the VHDX read-write, mount it, and `Optimize-Volume -ReTrim` to
       issue UNMAP so the VHDX layer releases freed blocks, then detach.
    2. Compact the file: try `Optimize-VHD -Mode Full` (Hyper-V module, usually
       absent on GitHub runners) and fall back to diskpart `compact vdisk`
       (VDS-based, works without Hyper-V).
  Every stage is wrapped so a partial capability still yields a usable VHDX.

.PARAMETER Output
  Path to the detached VHDX to optimise in place.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Output
)

$ErrorActionPreference = 'Stop'
$outFull = (Resolve-Path -LiteralPath $Output).Path
$tmp = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [System.IO.Path]::GetTempPath() }
$before = (Get-Item $outFull).Length

function Invoke-Diskpart([string]$script, [string]$name) {
  $file = Join-Path $tmp $name
  $script | Set-Content -Encoding Ascii -Path $file
  diskpart /s $file | Out-Null
}

# 1) Attach read-write, mount, ReTrim (UNMAP), detach.
$mount = Join-Path $tmp ("opt-" + [guid]::NewGuid().ToString('N'))
if (Test-Path $mount) { Remove-Item -Recurse -Force $mount }
New-Item -ItemType Directory -Force -Path $mount | Out-Null
try {
  Invoke-Diskpart @"
select vdisk file="$outFull"
attach vdisk
assign mount="$mount"
"@ 'opt-attach.txt'

  try {
    $vol = Get-Volume -FilePath $mount -ErrorAction Stop
    Optimize-Volume -InputObject $vol -ReTrim -ErrorAction Stop
    Write-Host "Optimize-Volume -ReTrim completed"
  } catch {
    Write-Warning "ReTrim skipped: $($_.Exception.Message)"
  }
} finally {
  Invoke-Diskpart @"
select vdisk file="$outFull"
detach vdisk
"@ 'opt-detach.txt'
  Remove-Item -Recurse -Force $mount -ErrorAction SilentlyContinue
}

# 2) Compact the file. Prefer Optimize-VHD; fall back to diskpart.
$compacted = $false
if (Get-Command Optimize-VHD -ErrorAction SilentlyContinue) {
  try {
    Optimize-VHD -Path $outFull -Mode Full -ErrorAction Stop
    $compacted = $true
    Write-Host "Optimize-VHD -Mode Full completed"
  } catch {
    Write-Warning "Optimize-VHD failed ($($_.Exception.Message)); falling back to diskpart"
  }
}
if (-not $compacted) {
  # `compact vdisk` requires the vdisk attached read-only.
  Invoke-Diskpart @"
select vdisk file="$outFull"
attach vdisk readonly
compact vdisk
detach vdisk
"@ 'opt-compact.txt'
  Write-Host "diskpart compact vdisk completed"
}

$after = (Get-Item $outFull).Length
$mib = 1MB
Write-Host ("Optimised VHDX: {0:N1} MiB -> {1:N1} MiB (reclaimed {2:N1} MiB)" -f ($before/$mib), ($after/$mib), (($before-$after)/$mib))

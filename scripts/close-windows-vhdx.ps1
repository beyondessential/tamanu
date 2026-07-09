<#
.SYNOPSIS
  Detach a VHDX previously opened with open-windows-vhdx.ps1.

.PARAMETER Output
  Path to the VHDX image to detach.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)][string]$Output
)

$ErrorActionPreference = 'Stop'

$outFull = (Resolve-Path -LiteralPath $Output).Path

$detachScript = @"
select vdisk file="$outFull"
detach vdisk
"@
$detachFile = Join-Path $env:RUNNER_TEMP 'diskpart-close.txt'
$detachScript | Set-Content -Encoding Ascii -Path $detachFile
diskpart /s $detachFile
if ($LASTEXITCODE -ne 0) { throw "diskpart close failed ($LASTEXITCODE)" }

$sizeMB = [math]::Round((Get-Item $outFull).Length / 1MB, 1)
Write-Host "Closed VHDX: $outFull ($sizeMB MiB on-disk)"

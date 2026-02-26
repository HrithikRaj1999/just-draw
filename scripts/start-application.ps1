param(
  [switch]$Cloud,
  [switch]$Local,
  [switch]$CheckPackages,
  [int]$DesiredCount = 2
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot

$Args = @("scripts/run.py", "start", "--desired-count", "$DesiredCount")
if ($Cloud) { $Args += "--cloud" }
if ($Local) { $Args += "--local" }
if ($CheckPackages) { $Args += "--check-packages" }

python @Args
$ExitCode = $LASTEXITCODE

Pop-Location
exit $ExitCode

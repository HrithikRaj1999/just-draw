param(
  [switch]$Cloud,
  [switch]$Local
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot

$Args = @("scripts/run.py", "stop")
if ($Cloud) { $Args += "--cloud" }
if ($Local) { $Args += "--local" }

python @Args
$ExitCode = $LASTEXITCODE

Pop-Location
exit $ExitCode

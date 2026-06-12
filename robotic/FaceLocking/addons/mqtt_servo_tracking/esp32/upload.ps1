param(
    [Parameter(Mandatory = $true)]
    [string]$Port,

    [string]$Fqbn = "esp32:esp32:esp32",

    [string]$SketchName = "face_tracker_servo_esp32"
)

$ErrorActionPreference = "Stop"
$SketchDir = Join-Path $PSScriptRoot $SketchName
$ArduinoCli = Get-Command arduino-cli -ErrorAction SilentlyContinue

if (-not $ArduinoCli) {
    $BundledCli = "C:\Program Files\Arduino IDE\resources\app\lib\backend\resources\arduino-cli.exe"
    if (Test-Path $BundledCli) {
        $ArduinoCli = $BundledCli
    } else {
        throw "arduino-cli was not found in PATH or Arduino IDE bundle. Install it first: https://arduino.github.io/arduino-cli/latest/installation/"
    }
} else {
    $ArduinoCli = $ArduinoCli.Source
}

Write-Host "Compiling $SketchDir for $Fqbn"
& $ArduinoCli compile --fqbn $Fqbn $SketchDir

Write-Host "Uploading to $Port"
& $ArduinoCli upload -p $Port --fqbn $Fqbn $SketchDir

Write-Host "Done."

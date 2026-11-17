$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Join-Path $PSScriptRoot 'prototype')
$defaultCatalogVersion = (Get-Content -LiteralPath 'math/targets-v19.json' -Raw | ConvertFrom-Json).version
$prototypePorts = if ($env:NINTH_RITE_PORT) { [int]$env:NINTH_RITE_PORT } else { 3014, 3015, 3016 }
$availablePort = $null
foreach ($port in $prototypePorts) {
    if (-not (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)) {
        if ($null -eq $availablePort) { $availablePort = $port }
        continue
    }
    $prototypeUrl = "http://127.0.0.1:$port"
    try {
        $gamePage = Invoke-WebRequest -Uri "$prototypeUrl/" -UseBasicParsing -TimeoutSec 2
        if (-not $gamePage.Content.Contains('id="gameControls"')) { continue }
        $controls = Invoke-WebRequest -Uri "$prototypeUrl/slot-controls.mjs" -UseBasicParsing -TimeoutSec 2
        if ($controls.StatusCode -eq 200 -and $controls.Headers['Content-Type'] -like 'text/javascript*') {
            $gameConfig = Invoke-RestMethod -Uri "$prototypeUrl/api/config?rulesVersion=rite-v1.9" -TimeoutSec 2
            if ($env:NINTH_USE_GENERATOR -ne '1' -and $gameConfig.catalogVersion -ne $defaultCatalogVersion) { continue }
            if ($env:NINTH_USE_GENERATOR -eq '1' -and $gameConfig.catalogVersion) { continue }
            Write-Output "THE NINTH RITE is running at $prototypeUrl/"
            exit 0
        }
    } catch {
        continue
    }
}
if ($null -eq $availablePort) {
    throw 'The prototype ports are occupied. Set NINTH_RITE_PORT to an available port.'
}
$env:NINTH_RITE_PORT = [string]$availablePort
& node.exe server.mjs
exit $LASTEXITCODE

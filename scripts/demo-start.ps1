param(
    [int]$Port = 3000,
    [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$envFiles = @(".env.local", ".env")
foreach ($envFile in $envFiles) {
    if (Test-Path $envFile) {
        Get-Content $envFile | ForEach-Object {
            $line = $_.Trim()
            if ([string]::IsNullOrWhiteSpace($line) -or $line.StartsWith("#")) { return }

            if ($line -match "^([^=]+)=(.*)$") {
                $name = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
        break
    }
}

$nodeBin = "C:\Users\galit\AppData\Local\nvm\versions\node\v22.17.0\bin"
if (Test-Path $nodeBin) {
    $env:Path = "$nodeBin;$env:Path"
}

Write-Host "Cleaning stale Node/Next processes..."
Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" } | Stop-Process -Force -ErrorAction SilentlyContinue

foreach ($p in @(3000, 3001, 3002)) {
    $connections = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            try {
                Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
            } catch {}
        }
    }
}

if (-not $SkipBuild) {
    Write-Host "Running production build check..."
    npm run build
}

Write-Host "Starting demo app on http://localhost:$Port ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$repoRoot'; npm run dev -- --hostname 0.0.0.0 --port $Port" -WorkingDirectory $repoRoot

$attempts = 0
while ($attempts -lt 60) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
            Write-Host "Demo app is LIVE at http://localhost:$Port"
            exit 0
        }
    } catch {
        Start-Sleep -Seconds 2
    }

    $attempts++
}

Write-Error "Demo app did not become ready on port $Port within the timeout."
exit 1

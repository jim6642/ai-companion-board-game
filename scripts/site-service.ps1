param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Start", "Stop")]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$Port = 3001
$SiteUrl = "http://localhost:$Port/zh/companion"
$ProjectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$PidPath = Join-Path $ProjectRoot ".site-server-$Port.pid"
$OutLogPath = Join-Path $ProjectRoot ".site-server-$Port.out.log"
$ErrorLogPath = Join-Path $ProjectRoot ".site-server-$Port.err.log"

function Get-SiteListener {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Get-ListenerProcess([int]$ProcessId) {
  Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
}

function Test-IsProjectProcess($ProcessInfo) {
  if (-not $ProcessInfo) { return $false }
  $commandLine = if ($ProcessInfo.CommandLine) { $ProcessInfo.CommandLine } else { "" }
  return $commandLine.IndexOf($ProjectRoot, [StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Open-Site {
  Start-Process $SiteUrl
}

try {
  Set-Location -LiteralPath $ProjectRoot
  $listener = Get-SiteListener

  if ($Action -eq "Stop") {
    if (-not $listener) {
      Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
      Write-Host "The site service is not running." -ForegroundColor Yellow
      exit 0
    }

    $processInfo = Get-ListenerProcess $listener.OwningProcess
    if (-not (Test-IsProjectProcess $processInfo)) {
      throw "Port 3001 belongs to another program. Nothing was stopped."
    }

    Stop-Process -Id $listener.OwningProcess -Force
    for ($attempt = 0; $attempt -lt 20 -and (Get-SiteListener); $attempt += 1) {
      Start-Sleep -Milliseconds 150
    }
    Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
    Write-Host "The site service has stopped and port 3001 is free." -ForegroundColor Green
    exit 0
  }

  if ($listener) {
    $processInfo = Get-ListenerProcess $listener.OwningProcess
    if (-not (Test-IsProjectProcess $processInfo)) {
      throw "Port 3001 is already in use by another program."
    }
    Write-Host "The site is already running. Opening the browser..." -ForegroundColor Green
    Open-Site
    exit 0
  }

  if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot ".next\BUILD_ID"))) {
    $pnpm = Get-Command pnpm.cmd -ErrorAction Stop
    Write-Host "The first launch needs a production build. Please wait..." -ForegroundColor Cyan
    & $pnpm.Source build
    if ($LASTEXITCODE -ne 0) { throw "The production build failed." }
  }

  $node = Get-Command node.exe -ErrorAction Stop
  $nextScript = Join-Path $ProjectRoot "node_modules\next\dist\bin\next"
  if (-not (Test-Path -LiteralPath $nextScript)) {
    throw "Project dependencies are missing. Run pnpm install first."
  }

  Write-Host "Starting the site service..." -ForegroundColor Cyan
  $server = Start-Process `
    -FilePath $node.Source `
    -ArgumentList @("`"$nextScript`"", "start", "-p", "$Port") `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $OutLogPath `
    -RedirectStandardError $ErrorLogPath `
    -PassThru

  for ($attempt = 0; $attempt -lt 80; $attempt += 1) {
    Start-Sleep -Milliseconds 250
    $listener = Get-SiteListener
    if ($listener) {
      $processInfo = Get-ListenerProcess $listener.OwningProcess
      if (-not (Test-IsProjectProcess $processInfo)) {
        Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
        throw "Another program took port 3001 while the site was starting."
      }
      Set-Content -LiteralPath $PidPath -Value $listener.OwningProcess -Encoding ascii
      Write-Host "The site is ready: $SiteUrl" -ForegroundColor Green
      Open-Site
      exit 0
    }
    if ($server.HasExited) { break }
  }

  $details = if (Test-Path -LiteralPath $ErrorLogPath) {
    (Get-Content -LiteralPath $ErrorLogPath -Tail 12) -join [Environment]::NewLine
  } else {
    "No error log was created."
  }
  throw "The site could not start.$([Environment]::NewLine)$details"
} catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

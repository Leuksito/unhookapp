<#
.SYNOPSIS
  UnhookApp — one-click setup and launch
  Supports English and Spanish (auto-detects based on system UI culture)
#>

$lang = (Get-Culture).TwoLetterISOLanguageName
$es = $lang -eq "es"

function msg($en, $sp) { if ($es) { $sp } else { $en } }

Write-Host "=== UnhookApp Setup ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check .env
$envPath = Join-Path $PSScriptRoot "server\.env"
if (-not (Test-Path $envPath)) {
    Write-Host (msg "Creating .env from .env.example..." "Creando .env desde .env.example...") -ForegroundColor Yellow
    Copy-Item (Join-Path $PSScriptRoot "server\.env.example") $envPath
    Write-Host ""
    Write-Host (msg "⚠  IMPORTANT: Open server\.env and paste your Google credentials." "⚠  IMPORTANTE: Abre server\.env y pon tus credenciales de Google.") -ForegroundColor Red
    Write-Host (msg "  Then run this script again." "  Luego ejecuta este script otra vez.") -ForegroundColor Red
    Write-Host ""

    Start-Process notepad.exe -ArgumentList $envPath
}

# 2. Check if Google credentials are set
$envContent = Get-Content $envPath
$hasCredentials = $false
foreach ($line in $envContent) {
    if ($line -match '^GOOGLE_CLIENT_ID=(.+)$' -and $matches[1] -ne '') {
        $hasCredentials = $true
    }
}

if (-not $hasCredentials) {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host (msg "  STEP-BY-STEP GUIDE — CREATE GOOGLE CREDENTIALS" "  GUIA PASO A PASO — CREAR CREDENCIALES DE GOOGLE") -ForegroundColor Magenta
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "1. " (msg "Open https://console.cloud.google.com" "Abre https://console.cloud.google.com") -ForegroundColor White
    Write-Host "2. " (msg "Create a NEW PROJECT (or select an existing one)" "Crea un NUEVO PROYECTO (o selecciona uno existente)") -ForegroundColor White
    Write-Host "3. " (msg "Go to APIs & Services > Library" "Ve a APIs & Services > Library") -ForegroundColor White
    Write-Host "4. " (msg "Search for 'Gmail API' and ENABLE it" "Busca 'Gmail API' y ACTÍVALA") -ForegroundColor White
    Write-Host "5. " (msg "Go to APIs & Services > Credentials" "Ve a APIs & Services > Credentials") -ForegroundColor White
    Write-Host "6. " (msg "Click + CREATE CREDENTIALS > OAuth 2.0 Client ID" "Click en + CREATE CREDENTIALS > OAuth 2.0 Client ID") -ForegroundColor White
    Write-Host "7. " (msg "Application type: Web application" "Application type: Web application") -ForegroundColor White
    Write-Host "8. " (msg "Name: UnhookApp" "Name: UnhookApp") -ForegroundColor White
    Write-Host "9. " (msg "Authorized redirect URIs, click + ADD:" "En Authorized redirect URIs, click + AÑADE:") -ForegroundColor White
    Write-Host "   http://localhost:3001/api/auth/callback" -ForegroundColor Green
    Write-Host "10. " (msg "Click CREATE" "Click CREATE") -ForegroundColor White
    Write-Host "11. " (msg "COPY the Client ID and Client Secret" "COPIA el Client ID y Client Secret") -ForegroundColor Yellow
    Write-Host "12. " (msg "Paste them in server\.env (notepad should already be open)" "Pégalos en server\.env (notepad ya debería estar abierto)") -ForegroundColor Yellow
    Write-Host ""
    Write-Host (msg "AFTER adding credentials, run this script again." "DESPUES de poner las credenciales, ejecuta este script otra vez.") -ForegroundColor Cyan
    Write-Host ""
    Read-Host (msg "Press ENTER to exit" "Presiona ENTER para salir")
    exit
}

# 3. Install dependencies
Write-Host (msg "Installing server dependencies..." "Instalando dependencias del servidor...") -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "server")
npm install

Write-Host (msg "Installing client dependencies..." "Instalando dependencias del cliente...") -ForegroundColor Cyan
Set-Location (Join-Path $PSScriptRoot "client")
npm install

# 4. Start both
Write-Host ""
Write-Host (msg "Starting server and client..." "Iniciando servidor y cliente...") -ForegroundColor Green
Write-Host ""

$serverPath = Join-Path $PSScriptRoot "server"
$clientPath = Join-Path $PSScriptRoot "client"

# Start server in new window
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$serverPath'; npm start"

# Start client in new window
Start-Process powershell -ArgumentList "-NoExit -Command Set-Location '$clientPath'; npm run dev"

Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  " (msg "Ready! Open in your browser:" "Todo listo! Abre en tu navegador:") "   ║" -ForegroundColor Green
Write-Host "║  →  http://localhost:5173               ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

Read-Host (msg "Press ENTER to exit" "Presiona ENTER para salir")

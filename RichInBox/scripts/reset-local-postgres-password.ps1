# Resets the local PostgreSQL superuser password to 'postgres'.
# MUST be run from an elevated (Administrator) PowerShell.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts\reset-local-postgres-password.ps1

$ErrorActionPreference = 'Stop'

$PgBin   = 'C:\Program Files\PostgreSQL\18\bin'
$DataDir = 'C:\Program Files\PostgreSQL\18\data'
$Hba     = Join-Path $DataDir 'pg_hba.conf'
$Backup  = Join-Path $DataDir 'pg_hba.conf.reachinbox.bak'
$Service = 'postgresql-x64-18'
$NewPassword = 'postgres'

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error 'This script must be run as Administrator. Open PowerShell as admin and re-run.'
}

Write-Host "[1/6] Backing up pg_hba.conf -> $Backup"
Copy-Item -LiteralPath $Hba -Destination $Backup -Force

try {
    Write-Host '[2/6] Setting local connections to trust (temporary)'
    (Get-Content -LiteralPath $Hba) -replace '(?<=\s)scram-sha-256\s*$', 'trust' | Set-Content -LiteralPath $Hba

    Write-Host "[3/6] Restarting $Service"
    Restart-Service -Name $Service -Force
    Start-Sleep -Seconds 3

    Write-Host '[4/6] Resetting postgres password'
    & (Join-Path $PgBin 'psql.exe') -U postgres -h 127.0.0.1 -p 5432 -c "ALTER USER postgres WITH PASSWORD '$NewPassword';"
}
finally {
    Write-Host '[5/6] Restoring original pg_hba.conf'
    Copy-Item -LiteralPath $Backup -Destination $Hba -Force
    Remove-Item -LiteralPath $Backup -Force

    Write-Host "[6/6] Restarting $Service"
    Restart-Service -Name $Service -Force
}

Write-Host ''
Write-Host "Done. postgres password is now '$NewPassword' and auth is restored to scram-sha-256." -ForegroundColor Green

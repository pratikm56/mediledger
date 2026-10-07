<#
.SYNOPSIS
    Database restore utility for MediLedger (Windows / PowerShell)
.DESCRIPTION
    Restores a PostgreSQL backup file (.dump or .sql) using pg_restore / psql.
.PARAMETER BackupFile
    Path to the backup file to restore
.PARAMETER DatabaseName
    Target database name (default: mediledger)
.PARAMETER Hostname
    PostgreSQL server host (default: localhost)
.PARAMETER Port
    PostgreSQL server port (default: 5432)
.PARAMETER Username
    PostgreSQL username (default: postgres)
.PARAMETER Force
    Skip confirmation prompt
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$DatabaseName = "mediledger",
    [string]$Hostname = "localhost",
    [int]$Port = 5432,
    [string]$Username = "postgres",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

if (!(Test-Path -Path $BackupFile)) {
    Write-Host " [ERROR] Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         MediLedger Database Restore Utility              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Source Backup:  $BackupFile"
Write-Host "Target DB:      $DatabaseName"
Write-Host "Host:           ${Hostname}:${Port}"
Write-Host "User:           $Username"
Write-Host "----------------------------------------------------------"

if (-not $Force) {
    $confirm = Read-Host "WARNING: Restoring will overwrite existing data in '$DatabaseName'. Proceed? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Restore cancelled." -ForegroundColor Yellow
        exit 0
    }
}

try {
    if ($BackupFile.EndsWith(".dump")) {
        Write-Host "Restoring custom compressed format using pg_restore..."
        & pg_restore -h $Hostname -p $Port -U $Username -d $DatabaseName --clean --if-exists -v $BackupFile
    } elseif ($BackupFile.EndsWith(".sql")) {
        Write-Host "Restoring plain SQL script using psql..."
        & psql -h $Hostname -p $Port -U $Username -d $DatabaseName -f $BackupFile
    } else {
        Write-Host " [ERROR] Unsupported backup file format. Expected .dump or .sql" -ForegroundColor Red
        exit 1
    }

    Write-Host " [SUCCESS] Database restored successfully!" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] Restore operation failed: $_" -ForegroundColor Red
    exit 1
}

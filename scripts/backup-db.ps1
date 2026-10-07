<#
.SYNOPSIS
    Automated PostgreSQL database backup script for MediLedger (Windows / PowerShell)
.DESCRIPTION
    Creates compressed timestamped backup files (.dump) using pg_dump.
    Automatically purges backups older than retention period (default: 30 days).
.PARAMETER DatabaseName
    Target database name (default: mediledger)
.PARAMETER Hostname
    PostgreSQL server host (default: localhost)
.PARAMETER Port
    PostgreSQL server port (default: 5432)
.PARAMETER Username
    PostgreSQL username (default: postgres)
.PARAMETER BackupDir
    Directory to store backup files (default: ./backups)
.PARAMETER RetentionDays
    Number of days to retain backups (default: 30)
#>

param (
    [string]$DatabaseName = "mediledger",
    [string]$Hostname = "localhost",
    [int]$Port = 5432,
    [string]$Username = "postgres",
    [string]$BackupDir = "./backups",
    [int]$RetentionDays = 30
)

$ErrorActionPreference = "Stop"

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupPath = Join-Path -Path $BackupDir -ChildPath "${DatabaseName}_backup_${Timestamp}.dump"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "         MediLedger Automated Database Backup             " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Database:       $DatabaseName"
Write-Host "Host:           ${Hostname}:${Port}"
Write-Host "Destination:    $BackupPath"
Write-Host "Retention:      $RetentionDays days"
Write-Host "----------------------------------------------------------"

if (!(Test-Path -Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    Write-Host "Created backup directory: $BackupDir"
}

# Check pg_dump availability
$pgDumpCmd = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpCmd) {
    Write-Host " [WARNING] 'pg_dump' utility not found in PATH." -ForegroundColor Yellow
    Write-Host " If PostgreSQL is installed, ensure bin directory is added to PATH." -ForegroundColor Yellow
    Write-Host " Example: C:\Program Files\PostgreSQL\16\bin" -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host "Executing pg_dump..."
    & pg_dump -h $Hostname -p $Port -U $Username -Fc -v -f $BackupPath $DatabaseName

    if ($LASTEXITCODE -eq 0 -and (Test-Path $BackupPath)) {
        $fileSize = (Get-Item $BackupPath).Length / 1KB
        Write-Host " [SUCCESS] Backup completed successfully!" -ForegroundColor Green
        Write-Host " File: $BackupPath ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
    } else {
        Write-Host " [ERROR] pg_dump failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }

    # Purge old backups
    Write-Host "`nPurging backups older than $RetentionDays days..."
    $cutoff = (Get-Date).AddDays(-$RetentionDays)
    Get-ChildItem -Path $BackupDir -Filter "${DatabaseName}_backup_*.dump" | Where-Object { $_.LastWriteTime -lt $cutoff } | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host " Purged old backup: $($_.Name)" -ForegroundColor DarkGray
    }

} catch {
    Write-Host " [ERROR] Backup execution failed: $_" -ForegroundColor Red
    exit 1
}

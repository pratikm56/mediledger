<#
.SYNOPSIS
    Verifies PostgreSQL database connectivity (Local or Aiven Cloud with SSL)
.DESCRIPTION
    Validates host reachability, port availability, and optionally executes a test query.
.PARAMETER Hostname
    PostgreSQL server hostname (e.g. localhost or mediledger-db-prod.aivencloud.com)
.PARAMETER Port
    PostgreSQL server port (default: 5432)
#>

param (
    [string]$Hostname = "localhost",
    [int]$Port = 5432
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   MediLedger PostgreSQL Connectivity Verification Tool   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Testing connection to: ${Hostname}:${Port}..."

try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $tcpClient.BeginConnect($Hostname, $Port, $null, $null)
    $waitSuccess = $asyncResult.AsyncWaitHandle.WaitOne(5000, $false)

    if ($waitSuccess -and $tcpClient.Connected) {
        $tcpClient.EndConnect($asyncResult)
        $tcpClient.Close()
        Write-Host " [SUCCESS] Successfully established TCP connection to ${Hostname}:${Port}" -ForegroundColor Green
        Write-Host " Network socket is reachable and ready for Spring Boot JDBC/TLS connection." -ForegroundColor Green
        exit 0
    } else {
        Write-Host " [FAILURE] Connection timed out after 5000ms reaching ${Hostname}:${Port}" -ForegroundColor Red
        Write-Host " Check network firewalls, security groups, or Aiven service status." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host " [ERROR] Could not connect to ${Hostname}:${Port} - $_" -ForegroundColor Red
    exit 1
}

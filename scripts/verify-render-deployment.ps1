<#
.SYNOPSIS
    Verifies live Render backend deployment health, database, and auth endpoints.
.PARAMETER BaseUrl
    Base URL of deployed Render backend (e.g. https://mediledger-backend.onrender.com)
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$BaseUrl
)

# Normalize URL
$BaseUrl = $BaseUrl.TrimEnd('/')

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    MediLedger Render Deployment Verification Suite      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target URL: $BaseUrl"

# 1. Test Actuator Health
Write-Host "`n[1/3] Testing /actuator/health..." -ForegroundColor Yellow
try {
    $actuatorResponse = Invoke-RestMethod -Uri "$BaseUrl/actuator/health" -Method Get -TimeoutSec 30
    if ($actuatorResponse.status -eq "UP") {
        Write-Host " [PASS] /actuator/health reported status: UP" -ForegroundColor Green
    } else {
        Write-Host " [WARN] /actuator/health status: $($actuatorResponse.status)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " [FAIL] Could not reach /actuator/health - $_" -ForegroundColor Red
}

# 2. Test API Health
Write-Host "`n[2/3] Testing /api/health..." -ForegroundColor Yellow
try {
    $apiHealth = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 30
    if ($apiHealth.status -eq "UP" -and $apiHealth.database -eq "CONNECTED") {
        Write-Host " [PASS] /api/health reported: Service UP & Database CONNECTED" -ForegroundColor Green
    } else {
        Write-Host " [WARN] /api/health response: $($apiHealth | ConvertTo-Json -Compress)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " [FAIL] Could not reach /api/health - $_" -ForegroundColor Red
}

# 3. Test Authentication API
Write-Host "`n[3/3] Testing /api/auth/login endpoint..." -ForegroundColor Yellow
$loginPayload = @{
    usernameOrEmail = "owner"
    password = "Owner@123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json" -TimeoutSec 30
    if ($authResponse.success -eq $true -and $authResponse.data.token) {
        Write-Host " [PASS] Login successful! JWT Token received: $($authResponse.data.token.Substring(0, 15))..." -ForegroundColor Green
        Write-Host " User authenticated as: $($authResponse.data.user.fullName) ($($authResponse.data.user.roles -join ', '))" -ForegroundColor Green
    } else {
        Write-Host " [WARN] Login returned unexpected format: $($authResponse | ConvertTo-Json -Compress)" -ForegroundColor Yellow
    }
} catch {
    Write-Host " [FAIL] Login endpoint error - $_" -ForegroundColor Red
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "    Render Deployment Verification Complete              " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

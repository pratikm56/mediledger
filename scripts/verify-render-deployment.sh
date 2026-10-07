#!/usr/bin/env bash
# ==============================================================================
# MediLedger Render Deployment Verification Suite (Bash / Linux / macOS)
# Usage: ./scripts/verify-render-deployment.sh https://<your-render-url>.onrender.com
# ==============================================================================

set -e

BASE_URL="${1:-http://localhost:8080}"
BASE_URL="${BASE_URL%/}"

echo "=========================================================="
echo "    MediLedger Render Deployment Verification Suite      "
echo "=========================================================="
echo "Target URL: $BASE_URL"

echo ""
echo "[1/3] Testing /actuator/health..."
ACTUATOR_STATUS=$(curl -s -f "$BASE_URL/actuator/health" | grep -o '"status":"UP"' || true)
if [ -n "$ACTUATOR_STATUS" ]; then
    echo " [PASS] /actuator/health reported status: UP"
else
    echo " [FAIL] Could not verify /actuator/health as UP"
fi

echo ""
echo "[2/3] Testing /api/health..."
HEALTH_BODY=$(curl -s "$BASE_URL/api/health")
echo " Response: $HEALTH_BODY"

echo ""
echo "[3/3] Testing /api/auth/login..."
AUTH_BODY=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"owner","password":"Owner@123"}')

if echo "$AUTH_BODY" | grep -q '"success":true'; then
    echo " [PASS] Login successful! Authentication API is healthy and operational."
else
    echo " [FAIL] Login failed: $AUTH_BODY"
fi

echo ""
echo "=========================================================="
echo "    Render Deployment Verification Complete              "
echo "=========================================================="

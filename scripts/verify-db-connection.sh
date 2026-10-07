#!/usr/bin/env bash
# ==============================================================================
# MediLedger PostgreSQL Connectivity Verification Tool (Linux / Bash / CI)
# ==============================================================================

set -e

HOST="${1:-localhost}"
PORT="${2:-5432}"

echo "=========================================================="
echo "   MediLedger PostgreSQL Connectivity Verification Tool   "
echo "=========================================================="
echo "Testing connection to: ${HOST}:${PORT}..."

if command -v nc >/dev/null 2>&1; then
    if nc -z -w 5 "$HOST" "$PORT"; then
        echo " [SUCCESS] TCP connection to ${HOST}:${PORT} succeeded."
        echo " Network socket is reachable and ready for Spring Boot JDBC/TLS."
        exit 0
    else
        echo " [FAILURE] Could not reach ${HOST}:${PORT}."
        exit 1
    fi
elif command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h "$HOST" -p "$PORT" -t 5; then
        echo " [SUCCESS] PostgreSQL is ready on ${HOST}:${PORT}."
        exit 0
    else
        echo " [FAILURE] pg_isready reported failure on ${HOST}:${PORT}."
        exit 1
    fi
else
    # Fallback to bash pseudo-device
    if (echo > /dev/tcp/"$HOST"/"$PORT") >/dev/null 2>&1; then
        echo " [SUCCESS] Connected to ${HOST}:${PORT}."
        exit 0
    else
        echo " [FAILURE] Could not connect to ${HOST}:${PORT}."
        exit 1
    fi
fi

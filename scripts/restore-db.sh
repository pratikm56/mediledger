#!/usr/bin/env bash
# ==============================================================================
# MediLedger Database Restore Utility (Linux / macOS)
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:?Error: Specify backup file path as first argument}"
DB_NAME="${2:-${DATABASE_NAME:-mediledger}}"
DB_HOST="${3:-${DATABASE_HOST:-localhost}}"
DB_PORT="${4:-${DATABASE_PORT:-5432}}"
DB_USER="${5:-${DATABASE_USER:-postgres}}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo " [ERROR] Backup file does not exist: ${BACKUP_FILE}"
    exit 1
fi

echo "=========================================================="
echo "         MediLedger Database Restore Utility              "
echo "=========================================================="
echo "Source Backup:  ${BACKUP_FILE}"
echo "Target DB:      ${DB_NAME}"
echo "Host:           ${DB_HOST}:${DB_PORT}"
echo "User:           ${DB_USER}"
echo "----------------------------------------------------------"

read -p "WARNING: Restoring will overwrite data in '${DB_NAME}'. Continue? (y/N): " -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Restore aborted by user."
    exit 0
fi

if [[ "${BACKUP_FILE}" == *.dump ]]; then
    echo "Restoring via pg_restore..."
    pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v "${BACKUP_FILE}"
elif [[ "${BACKUP_FILE}" == *.sql ]]; then
    echo "Restoring via psql..."
    psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f "${BACKUP_FILE}"
else
    echo " [ERROR] Unrecognized file format. Expected .dump or .sql"
    exit 1
fi

echo " [SUCCESS] Restore completed successfully!"

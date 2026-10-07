#!/usr/bin/env bash
# ==============================================================================
# MediLedger Automated PostgreSQL Backup Script (Linux / macOS / Cron)
# ==============================================================================

set -euo pipefail

DB_NAME="${1:-${DATABASE_NAME:-mediledger}}"
DB_HOST="${2:-${DATABASE_HOST:-localhost}}"
DB_PORT="${3:-${DATABASE_PORT:-5432}}"
DB_USER="${4:-${DATABASE_USER:-postgres}}"
BACKUP_DIR="${5:-${BACKUP_DIR:-./backups}}"
RETENTION_DAYS="${6:-30}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_backup_${TIMESTAMP}.dump"

echo "=========================================================="
echo "         MediLedger Automated Database Backup             "
echo "=========================================================="
echo "Database:    ${DB_NAME}"
echo "Host:        ${DB_HOST}:${DB_PORT}"
echo "User:        ${DB_USER}"
echo "Destination: ${BACKUP_FILE}"
echo "Retention:   ${RETENTION_DAYS} days"
echo "----------------------------------------------------------"

mkdir -p "${BACKUP_DIR}"

if ! command -v pg_dump >/dev/null 2>&1; then
    echo " [ERROR] pg_dump utility not found. Please install postgresql-client."
    exit 1
fi

echo "Running pg_dump..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -Fc -v -f "${BACKUP_FILE}" "${DB_NAME}"

if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo " [SUCCESS] Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo " [ERROR] Backup file was not generated."
    exit 1
fi

# Cleanup old backups
echo "Purging backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_backup_*.dump" -type f -mtime "+${RETENTION_DAYS}" -delete
echo "Done."

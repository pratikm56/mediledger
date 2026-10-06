# 💾 MediLedger Backup & Disaster Recovery Guide

Database integrity is mission critical for medical shop financial records, inventory valuation, and GST compliance.

---

## 1. Production Backup Strategy (Aiven PostgreSQL)

1. **Automated Backups**:
   - Aiven PostgreSQL automatically takes continuous Write-Ahead Log (WAL) backups and daily full snapshots.
   - Point-in-time recovery (PITR) is supported on all standard tiers.
2. **Backup Retention**:
   - Free/Development tier: Retains backups according to plan limits.
   - Production tier: Set to 7–30 days retention depending on business requirements.

---

## 2. Manual Backup (Logical Dump with pg_dump)

To take a standalone offline logical dump of the PostgreSQL database:

```bash
# Set credentials
export PGDATABASE="mediledger"
export PGUSER="postgres"
export PGHOST="localhost"
export PGPORT="5432"

# Perform compressed custom-format backup
pg_dump -Fc -v -f "mediledger_backup_$(date +%Y%m%d_%H%M%S).dump"
```

For plain SQL script backup:
```bash
pg_dump --clean --if-exists -f "mediledger_backup_$(date +%Y%m%d).sql"
```

---

## 3. Disaster Recovery & Database Restore Process

To restore from a backup file:

### From Custom Format (`.dump`):
```bash
pg_restore -v --clean --if-exists -d mediledger "mediledger_backup_<TIMESTAMP>.dump"
```

### From SQL Script (`.sql`):
```bash
psql -d mediledger -f "mediledger_backup_<TIMESTAMP>.sql"
```

---

## 4. Verification & Testing Procedure

Before declaring any backup operational:
1. Restore the dump into a temporary test database (e.g. `mediledger_restore_test`).
2. Verify row counts and integrity:
   - Check `flyway_schema_history` matches latest migration version.
   - Verify `roles` and `users` records.
   - Verify balance sheets and stock transaction tallies.
3. Drop the temporary test database after verification.

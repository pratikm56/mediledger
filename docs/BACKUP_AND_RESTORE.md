# 💾 MediLedger Backup, Restore & Disaster Recovery Runbook

Database integrity and rapid recovery are mission-critical for a pharmacy to safeguard historical medical invoices, inventory batches, ledger balances, and GST compliance records.

This document outlines the backup automation, test restoration, and recovery procedures across all operational scenarios.

---

## 1. Multi-Tier Backup Strategy

MediLedger employs a **two-tier defense-in-depth backup strategy**:

### Tier 1: Cloud-Native Continuous Backups (Aiven PostgreSQL)
- **Continuous WAL Streaming**: Every single commit is immediately written to Write-Ahead Logging (WAL) cloud storage.
- **Automated Daily Snapshots**: Full automated daily image backups taken by Aiven infrastructure.
- **Point-in-Time Recovery (PITR)**: Ability to restore the database to any specific minute in the last 7 to 30 days directly in the Aiven Console.

### Tier 2: Automated Off-Site Logical Dumps (`pg_dump`)
- Automated daily export using custom compressed format (`.dump`) with 30-day automatic retention rotation.
- Can be saved locally, to encrypted external storage (USB/NAS), or secondary cloud storage (AWS S3 / Google Cloud Storage).

---

## 2. Automated Backup Execution

### Windows (PowerShell)
MediLedger includes [`scripts/backup-db.ps1`](file:///d:/moneyLedger/scripts/backup-db.ps1):

```powershell
# Run manual backup of local database
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1

# Run backup targeting Aiven PostgreSQL cloud database
powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1 `
  -Hostname "mediledger-db-prod.aivencloud.com" `
  -Port 25432 `
  -Username "avnadmin" `
  -DatabaseName "defaultdb" `
  -BackupDir "D:\mediledger_backups" `
  -RetentionDays 30
```

### Linux / macOS / Server (Bash)
MediLedger includes [`scripts/backup-db.sh`](file:///d:/moneyLedger/scripts/backup-db.sh):

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh "defaultdb" "mediledger-db-prod.aivencloud.com" 25432 "avnadmin" "./backups" 30
```

---

## 3. Scheduling Automated Daily Backups

### Windows Task Scheduler (Pharmacy In-Store PC)
To run automated daily backups at 11:00 PM:
1. Open **Task Scheduler** (`taskschd.msc`).
2. Click **Create Basic Task...**
3. Name: `MediLedger Daily Backup`.
4. Trigger: **Daily** at `23:00` (11:00 PM).
5. Action: **Start a program**.
   - Program: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -WindowStyle Hidden -File "D:\moneyLedger\scripts\backup-db.ps1"`
6. Click **Finish**.

### Linux / Server Cron Job
Add to crontab via `crontab -e`:
```bash
# Run MediLedger database backup every night at 23:00 (11:00 PM)
0 23 * * * /opt/mediledger/scripts/backup-db.sh >> /var/log/mediledger-backup.log 2>&1
```

---

## 4. Disaster Recovery & Restoration Procedures

### Scenario A: Minor Data Corruption or Accidental Record Deletion
If staff accidentally modify or delete financial records:
1. Point-in-time recovery via Aiven Console:
   - Navigate to Aiven Console -> `mediledger-db-prod` -> **Backups**.
   - Click **Fork / Restore to a Point in Time**.
   - Select the timestamp 5 minutes prior to the accidental change.
   - Aiven creates a new restored database service within 3 minutes.
   - Update `SPRING_DATASOURCE_URL` in the Render dashboard to point to the restored service.

### Scenario B: Restoring from a Logical Backup File (`.dump`)
To restore an offline backup into a target PostgreSQL database:

#### On Windows:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/restore-db.ps1 `
  -BackupFile "backups/mediledger_backup_20261007_230000.dump" `
  -DatabaseName "mediledger" `
  -Hostname "localhost" `
  -Port 5432 `
  -Username "postgres"
```

#### On Linux / macOS:
```bash
./scripts/restore-db.sh "backups/mediledger_backup_20261007_230000.dump" "mediledger" "localhost" 5432 "postgres"
```

---

## 5. Verification & Testing Checklist

Whenever restoring a database:
1. **Verify Flyway Migration State**:
   ```sql
   SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;
   ```
   Ensure version is at `10` and `success` is `true`.
2. **Verify User Accounts**:
   ```sql
   SELECT id, username, full_name, active FROM users;
   ```
   Ensure administrative accounts (`owner`, `admin`, `staff`) exist.
3. **Verify Medicine & Batch Stock Valuation**:
   ```sql
   SELECT COUNT(*) AS total_batches, SUM(quantity) AS total_units FROM medicine_batches;
   ```
4. **Verify Customer & Supplier Ledger Balances**:
   ```sql
   SELECT SUM(current_balance) FROM customers;
   SELECT SUM(current_balance) FROM suppliers;
   ```
5. **Verify Audit Trail Consistency**:
   ```sql
   SELECT COUNT(*) FROM audit_logs;
   ```
6. Start the Spring Boot backend in `validate` mode:
   ```bash
   mvn test -Dtest=DatabaseBackupRestoreVerificationTest
   ```
   If all tests pass, the restored database is declared 100% operationally verified.

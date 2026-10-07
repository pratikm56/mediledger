# ☁️ Aiven PostgreSQL Production Setup & Management Guide

This document outlines the setup, security hardening, connection parameters, migration procedures, and backup strategies for deploying **MediLedger** with **Aiven PostgreSQL**.

---

## 1. Architecture & Low-Budget Philosophy

MediLedger is designed for a single small pharmacy / medical shop. To keep operational costs near zero or minimal:
- **Compute (Backend)**: Render Web Service (Free/Starter tier)
- **Database**: Aiven PostgreSQL (Free Tier or Startup-1 Plan)
- **Frontend CDN**: Vercel (Hobby Tier)

Aiven provides fully-managed PostgreSQL with automated failover, TLS encryption by default, and continuous WAL backup streaming.

---

## 2. Setting Up Aiven PostgreSQL Service

### Step 1: Create Aiven Account & Project
1. Navigate to [https://console.aiven.io/](https://console.aiven.io/) and create an account.
2. Create a new project: `mediledger-prod`.

### Step 2: Create PostgreSQL Service
1. Click **Create Service**.
2. Select **PostgreSQL**.
3. **Cloud Provider & Region**:
   - Choose AWS or Google Cloud in the region closest to your pharmacy (e.g., `aws-ap-south-1` for Mumbai, India or `google-europe-west3` for Frankfurt).
4. **Plan**:
   - Select **Free Tier** (if available) or **Startup-1** (minimal persistent tier, 1 GB RAM, 1 CPU, 5 GB storage).
5. **Service Name**: `mediledger-db-prod`.
6. Click **Create Service**. Provisioning typically completes in 2–4 minutes.

---

## 3. Retrieving Connection Credentials Safely

> [!CAUTION]
> **NEVER** commit database credentials, hostnames, or passwords to Git or public repositories. All credentials must be stored exclusively in Render Environment Variables or local uncommitted `.env` files.

Once the service state changes to **Running**:
1. On the **Overview** tab, locate the **Connection Information** card.
2. Note the following parameters:
   - **Host**: e.g., `mediledger-db-prod-yourorg.aivencloud.com`
   - **Port**: e.g., `12345` (Aiven assigns unique ports per service)
   - **Database Name**: `defaultdb` (or create a new database `mediledger`)
   - **User**: `avnadmin`
   - **Password**: Click the eye icon to copy the generated strong password
   - **SSL Mode**: `require`

### Step 3: Format the JDBC Connection URL
Spring Boot connects to PostgreSQL via JDBC. Format the connection URL as follows:

```text
jdbc:postgresql://<HOST>:<PORT>/defaultdb?sslmode=require
```

**Example (Do not use placeholder values)**:
```text
jdbc:postgresql://mediledger-db-prod-yourorg.aivencloud.com:25432/defaultdb?sslmode=require
```

---

## 4. Configuring Render Backend with Aiven Credentials

In your Render dashboard for the `mediledger-backend` Web Service:
1. Navigate to **Environment**.
2. Add the following environment variables:

| Environment Variable | Value Example | Explanation |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates `application-prod.properties` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<AIVEN_HOST>:<PORT>/defaultdb?sslmode=require` | TLS encrypted JDBC connection |
| `SPRING_DATASOURCE_USERNAME` | `avnadmin` | Aiven primary user |
| `SPRING_DATASOURCE_PASSWORD` | `<AIVEN_SECRET_PASSWORD>` | Secret password |
| `PORT` | `8080` | Assigned dynamically by Render |
| `JWT_SECRET` | `<64_HEX_CHARACTERS>` | 256-bit secret generated via `openssl rand -hex 32` |
| `JWT_EXPIRATION` | `86400000` | 24 hours in milliseconds |
| `CORS_ALLOWED_ORIGINS` | `https://your-pharmacy.vercel.app` | Vercel production frontend origin |

---

## 5. Automated Database Migrations via Flyway

MediLedger uses **Flyway** for database versioning. When the backend starts up connected to Aiven:
1. Flyway creates the `flyway_schema_history` metadata table if it does not exist.
2. Flyway scans `classpath:db/migration` and executes all unapplied migrations in strict chronological order:
   - `V1__initial_schema.sql` (Core tables: users, roles, user_roles, business_settings, audit_logs)
   - `V2__authentication.sql` (Seeded default administrative accounts)
   - `V3__medicine_management.sql` (Categories, manufacturers, medicines)
   - `V4__inventory.sql` (Medicine batches, transactional stock ledger)
   - `V5__customers_suppliers.sql` (Customer and supplier ledger balances)
   - `V6__sales.sql` (Sales, sale items, invoice counters)
   - `V7__purchases.sql` (Inward purchases, purchase items)
   - `V8__payments_expenses.sql` (Customer receipts, supplier payments, expenses)
   - `V9__reports.sql` (Composite indices for analytical query performance)
   - `V10__audit_logs.sql` (Security audit triggers and composite indexes)
3. Hibernate initializes with `spring.jpa.hibernate.ddl-auto=validate`, ensuring zero schema drift without altering tables.

> [!NOTE]
> You **never** need to manually execute SQL files in Aiven. The Spring Boot backend safely manages all database schema migrations during boot.

---

## 6. Connection Pool & Resource Optimization

Aiven starter plans enforce concurrent connection limits (typically 20–50 connections). To ensure stability and prevent connection exhaustion:
- MediLedger's production configuration (`application-prod.properties`) limits the HikariCP connection pool:
  ```properties
  spring.datasource.hikari.maximum-pool-size=5
  spring.datasource.hikari.minimum-idle=1
  spring.datasource.hikari.idle-timeout=300000
  spring.datasource.hikari.max-lifetime=900000
  spring.datasource.hikari.connection-timeout=20000
  ```
- This guarantees the application never consumes more than 5 persistent connections, leaving ample capacity for background backups and database maintenance tasks.

---

## 7. Security Hardening & SSL/TLS Verification

1. **Compulsory TLS**: Aiven requires SSL connections by default. The `?sslmode=require` query parameter in the JDBC URL mandates that the JDBC driver establishes an encrypted TLS 1.3 tunnel before transmitting any authentication packets.
2. **CA Certificate**: Java 17 includes all major public Certificate Authorities (Let's Encrypt / DigiCert) in its default cacerts truststore. Aiven SSL certificates are recognized automatically out of the box without manual truststore imports.
3. **Password Rotation**: If credentials are ever accidentally shared:
   - In Aiven Console, go to the **Users** tab.
   - Click **Reset Password** for `avnadmin`.
   - Update `SPRING_DATASOURCE_PASSWORD` in the Render dashboard and trigger a redeployment.

---

## 8. Backup & Disaster Recovery Strategy

1. **Aiven Automated Backups**:
   - Aiven continuously archives WAL (Write-Ahead Logging) files and takes daily full snapshots.
   - Point-in-time recovery (PITR) is accessible from the Aiven Console: **Backups** tab -> **Restore**.
2. **Secondary Local / Cloud Backups via `pg_dump`**:
   - Run a scheduled `pg_dump` to create off-site encrypted backups:
   ```bash
   pg_dump "postgres://avnadmin:<PASSWORD>@<AIVEN_HOST>:<PORT>/defaultdb?sslmode=require" \
     --format=custom \
     --file=mediledger_backup_$(date +%Y%m%d_%H%M%S).dump
   ```
   - See [`docs/BACKUP_AND_RESTORE.md`](file:///d:/moneyLedger/docs/BACKUP_AND_RESTORE.md) for full backup automation procedures.

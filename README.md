# 🚀 MediLedger — Medical Shop Management & Billing POS System

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

**MediLedger** is a secure, responsive, and robust Medical Shop Management & Billing Web Application designed specifically for single medical shops and retail pharmacies. Built with high architectural rigor, zero mock data, and full financial accuracy (`BigDecimal` & `NUMERIC(12,2)`), MediLedger provides complete end-to-end pharmacy operations from medicine intake to counter POS billing, customer credits, supplier ledgers, operational expenses, and executive financial reports.

---

## 📑 Table of Contents
1. [Core Features & Capabilities](#-core-features--capabilities)
2. [Architecture Overview](#-architecture-overview)
3. [Project Directory Structure](#-project-directory-structure)
4. [Prerequisites & Technology Stack](#-prerequisites--technology-stack)
5. [Default Seed Credentials](#-default-seed-credentials)
6. [Quick Start (Local Development)](#-quick-start-local-development)
7. [Testing & Verification](#-testing--verification)
8. [Production Cloud Deployment](#-production-cloud-deployment)
9. [Backup, Restore & Disaster Recovery](#-backup-restore--disaster-recovery)
10. [Critical Engineering & Financial Rules](#-critical-engineering--financial-rules)
11. [Master 18-Phase Implementation Ledger](#-master-18-phase-implementation-ledger)

---

## ✨ Core Features & Capabilities

- 🔐 **Authentication & Granular RBAC**: JWT stateless authentication with auto-refresh, role-based authorization for `OWNER`, `ADMIN`, and `STAFF`.
- 💊 **Medicine & Category Catalog**: Medicine master with HSN codes, GST percentages, pack sizes, generic names, and manufacturer management.
- 📦 **Batch-Level Inventory & FEFO**: Granular batch tracking with expiry dates, purchase/mrp/selling prices, and automated First-Expiry-First-Out (FEFO) allocation.
- 📉 **Transactional Stock Ledger**: Append-only immutable stock transaction audit log (`PURCHASE`, `SALE`, `SALE_RETURN`, `PURCHASE_RETURN`, `DAMAGE_LOSS`, `CORRECTION`). Negative stock strictly prevented.
- 👥 **Customer & Supplier Ledgers**: Complete party management with running balances, contact info, GSTIN, doctor names, and credit tracking.
- 🛒 **Inward Purchases & Stock Intake**: Comprehensive purchase invoice recording with automatic batch creation, tax calculations, and supplier balance updating.
- ⚡ **Counter POS & Billing**: High-speed counter sales with keyboard shortcuts (F2 POS, F4 Search), barcoding/name search, auto batch selection, round-off, partial payment, and 80mm thermal receipt printing.
- 💰 **Customer Credit & Supplier Payments**: Dedicated payment receipt and voucher recording with automatic ledger balance adjustments.
- 💸 **Operational Expense Management**: Expense categorization, receipt tracking, cash flow impact, and vendor disbursement recording.
- 📊 **Executive Analytics & 10-Report Suite**: Real-time sales, purchases, low-stock alerts, expiry alerts (30/60/90 days), basic profit & loss (Sales - COGS - Expenses), customer & supplier outstandings, and one-click CSV exports.
- 🛡️ **Audit Logging & System Settings**: IP address logging, action audit trail, pharmacy business profile configuration (name, address, GST, drug license, contact).

---

## 🏛️ Architecture Overview

```
                         [ Desktop / Tablet / POS Terminal ]
                                         │
                                         ▼
                          ┌─────────────────────────────┐
                          │   React 19 + Vite Frontend  │  (Vercel SPA CDN)
                          └──────────────┬──────────────┘
                                         │ HTTPS / REST API
                                         ▼
                          ┌─────────────────────────────┐
                          │  Spring Boot 3.3.4 Backend  │  (Render Web Service)
                          └──────────────┬──────────────┘
                                         │ JDBC / SSL (TLSv1.3)
                                         ▼
                          ┌─────────────────────────────┐
                          │   PostgreSQL 16 Database    │  (Aiven Managed DB / Local Docker)
                          └─────────────────────────────┘
```

---

## 📂 Project Directory Structure

```text
moneyLedger/
├── backend/                             # Spring Boot 3.3.4 (Java 17)
│   ├── src/main/java/com/mediledger/
│   │   ├── config/                      # Security, CORS, OpenAPI, Database configs
│   │   ├── controller/                  # REST Controllers (thin API layer)
│   │   ├── dto/                         # Request / Response DTOs
│   │   ├── entity/                      # JPA Database Entities
│   │   ├── exception/                   # Global exception handlers
│   │   ├── mapper/                      # Entity <-> DTO mappers
│   │   ├── repository/                  # Spring Data JPA Repositories
│   │   ├── security/                    # JWT Authentication & Authorization
│   │   └── service/                     # Business logic and transaction management
│   ├── src/main/resources/
│   │   ├── db/migration/                # Flyway V1..V10 SQL migrations
│   │   ├── application.properties       # Base configuration
│   │   └── application-prod.properties  # Production cloud configuration
│   └── pom.xml
├── frontend/                            # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/                  # Navbar, Sidebar, Modal, Layout, Alerts
│   │   ├── context/                     # AuthContext, NotificationContext
│   │   ├── pages/                       # Dashboard, POS, Medicines, Purchases, Sales, etc.
│   │   ├── services/                    # Axios API client services
│   │   └── types/                       # TypeScript interfaces and models
│   ├── public/
│   ├── vercel.json                      # Vercel SPA routing rewrite configuration
│   ├── package.json
│   └── vite.config.ts
├── database/                            # Database initialization and schemas
├── docker/                              # Production Containerization
│   ├── Dockerfile.backend               # Multi-stage Eclipse Temurin JRE build
│   ├── Dockerfile.frontend              # Multi-stage Nginx Alpine SPA build
│   └── nginx.conf                       # Frontend reverse proxy config
├── scripts/                             # Disaster recovery & operations
│   ├── backup.sh                        # Automated PostgreSQL pg_dump with retention
│   ├── backup.bat                       # Windows automated backup script
│   ├── restore.sh                       # Point-in-time PostgreSQL restore script
│   ├── restore.bat                      # Windows restore script
│   └── healthcheck.sh                   # Backend & database health verification
├── render.yaml                          # Render Blueprint infrastructure as code
├── docker-compose.yml                   # Local development PostgreSQL 16 container
├── .env.example                         # Environment variables template
└── README.md
```

---

## ⚙️ Prerequisites & Technology Stack

| Component | Technology | Version |
| :--- | :--- | :--- |
| **Runtime Environment** | Java OpenJDK (Temurin) | 17 LTS |
| **Backend Framework** | Spring Boot | 3.3.4 |
| **Build Tool (Backend)** | Apache Maven | 3.9+ |
| **Database** | PostgreSQL | 16 |
| **Database Migrations** | Flyway Core | 10.x |
| **Frontend Framework** | React | 19.x |
| **Frontend Tooling** | Vite | 6.x |
| **Language (Frontend)** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | 4.x |
| **Icons** | Lucide React | Latest |

---

## 🔑 Default Seed Credentials

Upon initial database migration (`V2__authentication.sql`), the following three default accounts are seeded:

| Role | Username | Default Password | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **OWNER** | `owner` | `Owner@123` | Full administrative control, profit reports, audit logs, business settings. |
| **ADMIN** | `admin` | `Admin@123` | Inventory intake, purchases, sales, supplier management, expense tracking. |
| **STAFF** | `staff` | `Staff@123` | Counter POS billing, customer lookup, cash collection, stock viewing. |

> ⚠️ **Security Notice**: Change all default passwords immediately upon production deployment using the `/api/users/change-password` endpoint.

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Configure
```bash
git clone <repository-url>
cd moneyLedger
cp .env.example .env
```

### 2. Start PostgreSQL
```bash
docker compose up -d
```
*(Or use an existing local PostgreSQL instance on port 5432 with database `mediledger`).*

### 3. Start Backend
```bash
cd backend
mvn spring-boot:run
```
- API Base URL: `http://localhost:8080/api`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- Health Endpoint: `http://localhost:8080/api/health`

### 4. Start Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
- Web Application UI: `http://localhost:5173`

---

## 🧪 Testing & Verification

The system includes comprehensive backend and frontend test suites covering unit logic, financial precision, stock boundary constraints, and a complete 14-step pharmacy operations workflow.

### Run Backend Tests (96 Tests)
```bash
cd backend
mvn test
```
- Includes `FinalPharmacyWorkflowIntegrationTest`: Verifies the complete 14-step end-to-end pharmacy lifecycle:
  1. Authenticate user (`owner`/`admin`/`staff`)
  2. Add category, manufacturer, and medicine
  3. Record inward purchase with auto-batch creation
  4. Verify stock increment and supplier balance update
  5. Add customer and perform POS counter sale
  6. Verify stock deduction (FEFO) and customer balance increase
  7. Record partial customer credit receipt via UPI
  8. Verify customer balance reduction
  9. Record operational pharmacy expense
  10. Verify Basic Profit Report (Sales Revenue, COGS, Net Margin)
  11. Verify Stock Summary and Expiry Reports
  12. Verify Customer Outstanding Report
  13. Verify Audit Log Trail

### Run Frontend Tests (11 Tests) & Production Build
```bash
cd frontend
npm run test
npm run build
```

---

## ☁️ Production Cloud Deployment

### 1. Database (Aiven PostgreSQL 16)
- Create a PostgreSQL service on [Aiven.io](https://aiven.io).
- Enable SSL (`sslmode=require`) with TLSv1.3.
- Note the connection string: `jdbc:postgresql://<HOST>:<PORT>/defaultdb?sslmode=require`.

### 2. Backend (Render Web Service)
- Create a new Web Service using the root `render.yaml` or Docker configuration `docker/Dockerfile.backend`.
- Configure Environment Variables:
  - `SPRING_PROFILES_ACTIVE`: `prod`
  - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<aiven-host>:<port>/<db>?sslmode=require`
  - `SPRING_DATASOURCE_USERNAME`: `<db-user>`
  - `SPRING_DATASOURCE_PASSWORD`: `<db-password>`
  - `JWT_SECRET`: `<64-byte-secure-hex-key>`
  - `CORS_ALLOWED_ORIGINS`: `https://your-app.vercel.app`

### 3. Frontend (Vercel SPA)
- Import `frontend/` directory into [Vercel](https://vercel.com).
- Framework Preset: `Vite`.
- Environment Variable:
  - `VITE_API_URL`: `https://your-backend.onrender.com/api`
- Production SPA routing is pre-configured via `frontend/vercel.json`.

---

## 💾 Backup, Restore & Disaster Recovery

MediLedger includes automated backup and restore automation scripts in the `scripts/` folder:

### Taking a Database Backup
```bash
# Linux / macOS
./scripts/backup.sh

# Windows
.\scripts\backup.bat
```
Backups are saved to `backups/mediledger_YYYYMMDD_HHMMSS.sql.gz` with automatic 30-day retention cleanup.

### Restoring a Database
```bash
# Linux / macOS
./scripts/restore.sh backups/mediledger_20261007_120000.sql.gz

# Windows
.\scripts\restore.bat backups\mediledger_20261007_120000.sql.gz
```

---

## 🛡️ Critical Engineering & Financial Rules

1. **Absolute Financial Accuracy**: All monetary calculations in backend services use `BigDecimal` with explicit scale and `RoundingMode.HALF_UP`. Database tables use `NUMERIC(12,2)`. Floating-point numbers are prohibited.
2. **ACID Transaction Boundaries**: All billing transactions, inventory intakes, and balance postings run inside Spring `@Transactional(rollbackFor = Exception.class)`. A failure at any step causes a complete rollback.
3. **FEFO Inventory Enforcement**: POS checkout automatically prioritizes batches nearing expiry before newer batches.
4. **Zero Negative Stock**: Stock ledger prevents decrementing below zero at both the service layer and database check constraints.
5. **No Expired Medicine Sales**: Medicine batches past their expiry date are prohibited from being billed at the POS counter.
6. **Zero Hardcoded Secrets**: All sensitive secrets, database passwords, and JWT keys are loaded exclusively from environment variables.

---

## 📜 Master 18-Phase Implementation Ledger

| Phase | Description | Commit | Status |
| :--- | :--- | :--- | :---: |
| **Phase 1** | Foundation & Project Setup (Spring Boot 3.3, React 19, Flyway, PostgreSQL) | `f6fe22c` | ✅ Completed |
| **Phase 2** | Authentication & RBAC (JWT, Security, Seed Users: OWNER, ADMIN, STAFF) | `948484a` | ✅ Completed |
| **Phase 3** | Medicines, Categories & Manufacturers Catalog | `b5105db` | ✅ Completed |
| **Phase 4** | Batches, FEFO Selection & Stock Ledger | `f4a5465` | ✅ Completed |
| **Phase 5** | Customers, Suppliers & Account Ledgers | `0c29d72` | ✅ Completed |
| **Phase 6** | Inward Purchases & Stock Intake | `48412e0` | ✅ Completed |
| **Phase 7** | Sales, Billing & POS System (80mm Thermal Receipt, Shortcuts) | `fd98972` | ✅ Completed |
| **Phase 8** | Operational Expenses, Categories & Cash Flow Tracking | `12b8420` | ✅ Completed |
| **Phase 9** | Executive Dashboard & Real-Time Analytics | `eec2dac` | ✅ Completed |
| **Phase 10** | Comprehensive 10-Report Suite & CSV Export | `3782467` | ✅ Completed |
| **Phase 11** | Audit Logs, Business Settings & Security Hardening | `18c4154` | ✅ Completed |
| **Phase 12** | Comprehensive Testing & Business Rule Validation | `29d060e` | ✅ Completed |
| **Phase 13** | Production Configuration (Docker, Nginx, Vercel SPA) | `127a376` | ✅ Completed |
| **Phase 14** | Aiven PostgreSQL Cloud Setup & TLS/SSL Hardening | `bf83762` | ✅ Completed |
| **Phase 15** | Render Backend Deployment & Blueprint `render.yaml` | `d3288cc` | ✅ Completed |
| **Phase 16** | Vercel Frontend Deployment, SPA Routing & CDN Binding | `548f276` | ✅ Completed |
| **Phase 17** | Backup, Restore & Disaster Recovery Automation Scripts | `056529a` | ✅ Completed |
| **Phase 18** | Final End-to-End Test, 14-Step Workflow & System Verification | *Current* | ✅ Completed |

---

*MediLedger — Enterprise Pharmacy Management & Point of Sale System.*

# 🚀 MediLedger — Medical Shop Management & Billing System

[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://adoptium.net)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38bdf8.svg)](https://tailwindcss.com)

**MediLedger** is a secure, responsive, and robust Medical Shop Management & Billing Web Application designed specifically for small single medical shops and pharmacies. It provides end-to-end management of medicines, batches, inventory transactions, purchases, billing (POS), customers, suppliers, expenses, and profit analytics.

---

## 🏛️ Architecture Overview

MediLedger follows a clean, decoupled client-server architecture:

```
               [ User Desktop / Tablet / Mobile ]
                               |
                               v
                +------------------------------+
                |   React 18 + Vite Frontend   |  (Hosted on Vercel)
                +------------------------------+
                               |
                        HTTPS (REST API)
                               |
                               v
                +------------------------------+
                |   Spring Boot Backend (J17)  |  (Hosted on Render)
                +------------------------------+
                               |
                         JDBC / SSL
                               |
                               v
                +------------------------------+
                |     PostgreSQL 16 Database   |  (Aiven Cloud / Local Docker)
                +------------------------------+
```

---

## 📂 Project Directory Structure

```text
medical-shop-management/
├── frontend/                  # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # View pages
│   │   ├── services/          # Axios API client services
│   │   └── App.tsx            # Main shell & diagnostics
│   ├── package.json
│   └── vite.config.ts
├── backend/                   # Spring Boot 3.3 (Java 17) REST API
│   ├── src/main/java/com/mediledger/
│   │   ├── config/            # Security, CORS, OpenAPI, DB configs
│   │   ├── controller/        # REST Controllers (thin layer)
│   │   ├── service/           # Business logic layer
│   │   ├── repository/        # Spring Data JPA repositories
│   │   ├── entity/            # JPA database entities
│   │   ├── dto/               # Data Transfer Objects
│   │   ├── mapper/            # Entity <-> DTO mappers
│   │   ├── security/          # JWT and Spring Security filters
│   │   └── exception/         # Centralized error handling
│   ├── src/main/resources/
│   │   ├── db/migration/      # Flyway SQL migration scripts
│   │   └── application.properties
│   └── pom.xml
├── database/                  # Database init scripts
│   └── init.sql
├── docker/                    # Docker containerization files
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── nginx.conf
├── docs/                      # Architectural & operational documentation
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   ├── BACKUP_AND_RESTORE.md
│   └── TESTING.md
├── docker-compose.yml         # Local development database container
├── .env.example               # Environment variables template
└── README.md
```

---

## ⚙️ Prerequisites

- **Java**: OpenJDK 17 or higher
- **Maven**: 3.8+ (or use included `./mvnw`)
- **Node.js**: v18+ or v20+ / npm 9+
- **Docker & Docker Compose**: Optional for local PostgreSQL (bundled fallback available)
- **Git**

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone <repository-url>
cd moneyLedger
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```

### 3. Start Local PostgreSQL Database
Using Docker Compose:
```bash
docker compose up -d
```
*Note: If Docker is not running, the backend includes an embedded PostgreSQL fallback mechanism.*

### 4. Start Backend (Spring Boot)
```bash
cd backend
.\mvnw.cmd spring-boot:run
# or on Linux/macOS: ./mvnw spring-boot:run
```
Backend will start at: `http://localhost:8080`
- Swagger UI Documentation: `http://localhost:8080/swagger-ui.html`
- OpenAPI Specification: `http://localhost:8080/api-docs`
- Health Check: `http://localhost:8080/api/health`
- Actuator: `http://localhost:8080/actuator/health`

### 5. Start Frontend (React + Vite)
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend UI will start at: `http://localhost:5173`

---

## 🛡️ Critical Engineering Rules

1. **Precision Money Calculations**: Always use `BigDecimal` in Java and `NUMERIC(12,2)` in PostgreSQL. Never use `float` or `double`.
2. **Transaction Integrity**: All sales, purchases, and stock movements are executed atomically within `@Transactional` boundaries. Rollback on any failure.
3. **No Mock Data**: Real database operations and transactional logging across all phases.
4. **Zero Negative Stock**: Stock deductions are validated against available non-expired batch quantities.
5. **No Expired Medicine Sales**: Expired batches are blocked from POS sale selection.
6. **Zero Secrets in Git**: All credentials are provided through environment variables.

# 🏗️ MediLedger System Architecture

MediLedger is a modular, high-reliability Medical Shop Management & Billing application engineered for retail pharmacies.

---

## 1. High-Level Architecture

```
                    +--------------------------------+
                    |           END USER             |
                    | (Desktop / POS / Tablet / Mob) |
                    +--------------------------------+
                                   |
                                   v  (HTTPS)
                    +--------------------------------+
                    |         REACT FRONTEND         |
                    |    (Vite, TS, Tailwind CSS)    |
                    |        Hosted on Vercel        |
                    +--------------------------------+
                                   |
                                   v  (REST / JSON / JWT)
                    +--------------------------------+
                    |      SPRING BOOT BACKEND       |
                    |      (Java 17, Actuator)       |
                    |        Hosted on Render        |
                    +--------------------------------+
                                   |
                                   v  (JDBC SSL)
                    +--------------------------------+
                    |      POSTGRESQL DATABASE       |
                    |   (Flyway Migrations, ACIDS)   |
                    |     Hosted on Aiven Cloud      |
                    +--------------------------------+
```

---

## 2. Backend Layered Architecture

The backend strictly separates concerns across structured packages:

```text
com.mediledger
├── config/        # Infrastructure beans (Security, CORS, OpenAPI, DB)
├── controller/    # REST API endpoints (thin presentation layer, no business logic)
├── service/       # Business logic interfaces and transactional implementations
├── repository/    # Spring Data JPA interfaces with optimized queries
├── entity/        # Relational JPA entities mapped to PostgreSQL
├── dto/           # Request and response payloads (prevents entity leakage)
├── mapper/        # Explicit conversion between Entities and DTOs
├── security/      # JWT authentication tokens, filters, user details service
└── exception/     # Centralized exception hierarchy and RestControllerAdvice
```

### Architectural Principles:
1. **Controllers are Thin**: Controllers only accept DTOs, invoke services, and return responses.
2. **Business Logic in Services**: All validation, stock calculations, financial totals, and business rules reside in the service layer.
3. **Transactional Boundaries**: Multi-table modifications (sales checkout, purchase receipt, batch adjustments) use `@Transactional(rollbackFor = Exception.class)` for full ACID atomicity.
4. **Monetary Precision**: All currency and tax calculations use `java.math.BigDecimal` with `RoundingMode.HALF_UP` and PostgreSQL `NUMERIC(12,2)`. `float` and `double` are forbidden.
5. **No Blind Stock Modifiers**: All inventory changes create an immutable `StockTransaction` audit entry.

---

## 3. Frontend Architecture

- **Framework**: React 18 with Vite.
- **Language**: TypeScript with strict mode.
- **Styling**: Tailwind CSS with custom medical theme.
- **Routing**: React Router DOM with protected route guards.
- **State & Forms**: React Hook Form with Zod schema validation.
- **Charts & Visuals**: Recharts for dashboard analytics.
- **Icons**: Lucide React.
- **HTTP Client**: Axios with central interceptors for JWT token injection and error handling.

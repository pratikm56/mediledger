# 🗄️ MediLedger Database Architecture & Schema

MediLedger relies on **PostgreSQL 16** (with PostgreSQL 14+ compatibility) managed via **Flyway migrations**.

---

## 1. Schema Strategy

- **Migration Tool**: Flyway
- **Strict Rule**: Table structures and schema changes are NEVER created manually or via JPA auto-DDL. All changes are managed exclusively via versioned SQL migrations located in `backend/src/main/resources/db/migration/`.
- **Validation**: JPA Hibernate DDL is set to `validate` (`spring.jpa.hibernate.ddl-auto=validate`) to guarantee strict synchronization between entities and database schema.

---

## 2. Phase 1 Tables

### `roles`
Stores security roles for authorization.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Unique role identifier |
| `name` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | `ROLE_OWNER`, `ROLE_ADMIN`, `ROLE_STAFF` |
| `description` | `VARCHAR(255)` | | Human-readable role description |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record timestamp |

### `users`
System user accounts.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | User identifier |
| `username` | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Unique username |
| `email` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | User email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | BCrypt password hash |
| `full_name` | `VARCHAR(100)` | `NOT NULL` | Staff member full name |
| `phone` | `VARCHAR(20)` | | Contact telephone |
| `active` | `BOOLEAN` | `NOT NULL, DEFAULT TRUE` | Active/deactivated status |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update timestamp |

### `user_roles`
Junction table mapping users to roles.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE CASCADE` | User reference |
| `role_id` | `BIGINT` | `FK -> roles(id) ON DELETE CASCADE` | Role reference |

### `business_settings`
Configurable shop profile settings (GSTIN, prefix, shop name, contact details).
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Setting identifier |
| `setting_key` | `VARCHAR(100)` | `NOT NULL, UNIQUE` | Setting key name |
| `setting_value` | `TEXT` | | Stored setting value |
| `description` | `VARCHAR(255)` | | Setting description |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Update timestamp |

### `audit_logs`
Immutable audit trail for security and system events.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `BIGSERIAL` | `PRIMARY KEY` | Log identifier |
| `user_id` | `BIGINT` | `FK -> users(id) ON DELETE SET NULL` | Performing user |
| `action` | `VARCHAR(100)` | `NOT NULL` | Action code |
| `entity_type` | `VARCHAR(100)` | | Affected entity |
| `entity_id` | `VARCHAR(100)` | | Record ID |
| `details` | `TEXT` | | JSON / text context |
| `ip_address` | `VARCHAR(50)` | | Client IP address |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Event timestamp |

---

## 3. Flyway Migrations Status (All Implemented)

All migrations are located in `backend/src/main/resources/db/migration/`:
- `V1__initial_schema.sql` (Phase 1: Roles, users, business settings, audit logs)
- `V2__authentication.sql` (Phase 2: RBAC permissions and default administrative accounts)
- `V3__medicine_management.sql` (Phase 3: Categories, manufacturers, medicines)
- `V4__inventory.sql` (Phase 4: Medicine batches and transactional stock ledger)
- `V5__customers_suppliers.sql` (Phase 5: Customer and supplier ledgers with balance tracking)
- `V6__sales.sql` (Phase 7: Retail sales, billing items, payment status, invoice sequences)
- `V7__purchases.sql` (Phase 6: Inward purchase orders and batch inventory intake)
- `V8__payments_expenses.sql` (Phase 8: Customer receipts, supplier payments, and expense tracking)
- `V9__reports.sql` (Phase 10: Performance indexes for high-speed date-range reports)
- `V10__audit_logs.sql` (Phase 11: Security audit indexes and store owner settings)

---

## 4. Production Database Deployment (Aiven)

For complete instructions on provisioning and securing production PostgreSQL on Aiven:
See [☁️ Aiven PostgreSQL Production Guide](AIVEN_POSTGRESQL.md).


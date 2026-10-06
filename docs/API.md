# 📡 MediLedger API Documentation

MediLedger provides a standard REST API documented with OpenAPI 3.0 / Swagger.

- **Interactive Swagger UI**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Specification**: `http://localhost:8080/api-docs`

---

## 1. Standard Response Envelope

All API endpoints standardize their responses where appropriate:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-10-06T19:30:00+05:30"
}
```

Error response structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "fieldName": "Description of validation error"
  },
  "timestamp": "2026-10-06T19:30:00+05:30"
}
```

---

## 2. Implemented Phase 1 Endpoints

### System Health & Diagnostics
- **Endpoint**: `GET /api/health`
- **Access**: Public
- **Description**: Returns the runtime status of the backend, uptime, active profile, and verifies live connection to PostgreSQL database.
- **Sample Response**:
  ```json
  {
    "status": "UP",
    "database": "UP",
    "version": "1.0.0-SNAPSHOT",
    "environment": "default",
    "uptimeSeconds": 42,
    "timestamp": "2026-10-06T19:31:00+05:30"
  }
  ```

### Spring Boot Actuator Health Probe
- **Endpoint**: `GET /actuator/health`
- **Access**: Public
- **Description**: Standard Spring Boot health probe for cloud load balancers and deployment monitoring (e.g. Render).

---

## 3. Planned Endpoints Roadmap

| Module | Base Path | Key Operations |
|---|---|---|
| Authentication | `/api/auth` | Login, Logout, Current User |
| Users | `/api/users` | User CRUD, Role Assignment |
| Medicines | `/api/medicines` | Medicine CRUD, Search, Filter |
| Categories | `/api/categories` | Medicine Category Management |
| Manufacturers | `/api/manufacturers` | Pharma Manufacturer Management |
| Batches | `/api/batches` | Batch Management, Expiry Tracking |
| Inventory | `/api/inventory` | Stock Status, Adjustments, Valuations |
| Customers | `/api/customers` | Customer Management & Ledger |
| Suppliers | `/api/suppliers` | Supplier Management & Ledger |
| Purchases | `/api/purchases` | Stock Inward Invoices |
| Sales / Billing | `/api/sales` | POS Checkout, Invoicing |
| Payments | `/api/payments` | Customer & Supplier Payments |
| Expenses | `/api/expenses` | Shop Operating Expenses |
| Reports | `/api/reports` | Stock Summary, P&L, Sales, Expiry |
| Settings | `/api/settings` | Shop Business Configuration |
| Audit Logs | `/api/audit-logs` | Security & Transaction Audit Trail |

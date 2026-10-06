# 🧪 MediLedger Quality Assurance & Testing Strategy

MediLedger follows a test-driven development lifecycle across backend and frontend layers.

---

## 1. Backend Testing Matrix

### Running Tests:
```bash
cd backend
.\mvnw.cmd test
# or: mvn test
```

### Critical Test Requirements:
1. **Flyway Migrations**: Verify all migrations apply sequentially to clean database with zero syntax or constraint errors.
2. **ACID Transactions**:
   - Stock deduction must roll back completely if payment creation fails.
   - Batch creation and purchase receipt must roll back if supplier update fails.
3. **Business Invariants**:
   - Expired batches must fail validation on POS sale creation.
   - Sales exceeding available quantity must be rejected.
   - Negative stock must be prevented at the database constraint and application layer.
   - Cash / Credit transactions must reflect precisely in Customer / Supplier balances.

---

## 2. Frontend Testing Matrix

### Running Build & Lint:
```bash
cd frontend
npm run lint
npm run build
```

### Visual & Usability Testing:
- Desktop resolution: 1920x1080 and 1366x768 (standard POS monitors)
- Laptop resolution: 1280x800
- Tablet resolution: 768x1024 (iPad / Android POS tablets)
- Mobile resolution: 375x667 (iPhone SE) and 390x844 (Modern Android/iPhone)

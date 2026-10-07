-- ==============================================================================
-- MediLedger: Database Clean Slate Script
-- Target: Cloud PostgreSQL (Aiven / Neon / Supabase) or Local PostgreSQL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- OPTION 1: 100% COMPLETE FRESH START (Recommended for Real Pharmacy Launch)
-- This removes ALL sample medicines, batches, customers, suppliers, sales,
-- purchases, expenses, and audit logs.
-- It KEEPS your login accounts (owner, admin, staff) and system roles intact!
-- ------------------------------------------------------------------------------

BEGIN;

-- 1. Wipe all operational transactions and billing
TRUNCATE TABLE sale_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE sales RESTART IDENTITY CASCADE;
TRUNCATE TABLE purchase_items RESTART IDENTITY CASCADE;
TRUNCATE TABLE purchases RESTART IDENTITY CASCADE;
TRUNCATE TABLE payments RESTART IDENTITY CASCADE;
TRUNCATE TABLE expenses RESTART IDENTITY CASCADE;
TRUNCATE TABLE stock_transactions RESTART IDENTITY CASCADE;
TRUNCATE TABLE medicine_batches RESTART IDENTITY CASCADE;

-- 2. Wipe parties and contacts
TRUNCATE TABLE customers RESTART IDENTITY CASCADE;
TRUNCATE TABLE suppliers RESTART IDENTITY CASCADE;

-- 3. Wipe catalog and taxonomy
TRUNCATE TABLE medicines RESTART IDENTITY CASCADE;
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE manufacturers RESTART IDENTITY CASCADE;
TRUNCATE TABLE expense_categories RESTART IDENTITY CASCADE;

-- 4. Wipe demo audit logs
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;

-- 5. Re-seed clean essential expense categories for pharmacy accounting
INSERT INTO expense_categories (name, description, active) VALUES
    ('Electricity & Utilities', 'Monthly electricity, water and power backup', true),
    ('Shop Rent', 'Commercial pharmacy shop space lease', true),
    ('Staff Salary', 'Staff, pharmacist and assistant compensation', true),
    ('Packaging & Stationary', 'Medicine bags, billing thermal rolls, labels', true),
    ('Maintenance & Cleaning', 'AC servicing, pest control, repairs', true),
    ('Miscellaneous', 'Other incidental operational expenses', true);

COMMIT;

-- ==============================================================================
-- Verification Query: Check table counts after wiping demo data
-- ==============================================================================
SELECT 'medicines' AS table_name, COUNT(*) AS count FROM medicines
UNION ALL
SELECT 'medicine_batches', COUNT(*) FROM medicine_batches
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'purchases', COUNT(*) FROM purchases
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- ==============================================================================
-- Flyway Migration: V8__payments_expenses.sql
-- Description: Daily Shop Operational Expenses, Vouchers, and Ledger Settlements
-- ==============================================================================

-- 1. EXPENSE CATEGORIES TABLE
CREATE TABLE expense_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed default pharmacy expense categories
INSERT INTO expense_categories (name, description, active) VALUES
    ('Rent', 'Shop and storage room monthly rent', TRUE),
    ('Electricity & Utilities', 'Electricity power bills, water charges', TRUE),
    ('Salaries & Staff', 'Pharmacist, helper, and assistant staff remuneration', TRUE),
    ('Freight & Delivery', 'Medicine courier, transport, and parcel shipping charges', TRUE),
    ('Packaging & Bags', 'Medicine carry bags, envelopes, and packaging materials', TRUE),
    ('Refreshments & Tea', 'Staff daily refreshments, tea, and client hospitality', TRUE),
    ('Cleaning & Maintenance', 'Shop cleaning supplies, sanitization, electrical maintenance', TRUE),
    ('Printing & Stationery', 'Billing paper rolls, thermal rolls, registers, prescription slips', TRUE),
    ('License & Compliance', 'Drug license renewal, trade license, accounting fees', TRUE),
    ('Miscellaneous', 'Other incidental pharmacy expenditures', TRUE);

-- 2. EXPENSES TABLE
CREATE TABLE expenses (
    id BIGSERIAL PRIMARY KEY,
    voucher_number VARCHAR(50) NOT NULL UNIQUE,
    category_id BIGINT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    expense_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL, -- CASH, UPI, BANK_TRANSFER, CHEQUE, CARD
    recipient_name VARCHAR(150),
    reference_number VARCHAR(100),
    notes VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_voucher ON expenses(voucher_number);
CREATE INDEX idx_expenses_created ON expenses(created_at);

-- 3. PAYMENTS TABLE (Customer Receipts & Supplier Payments)
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    payment_type VARCHAR(30) NOT NULL, -- CUSTOMER_RECEIPT, SUPPLIER_PAYMENT
    customer_id BIGINT REFERENCES customers(id) ON DELETE RESTRICT,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE RESTRICT,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_mode VARCHAR(30) NOT NULL, -- CASH, UPI, BANK_TRANSFER, CHEQUE, CARD
    reference_number VARCHAR(100),
    notes VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_type ON payments(payment_type);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_supplier ON payments(supplier_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);

-- 4. SEED SAMPLE HISTORICAL EXPENSES
INSERT INTO expenses (voucher_number, category_id, expense_date, amount, payment_mode, recipient_name, reference_number, notes, created_by)
SELECT 
    'EXP-2026-0001', c.id, CURRENT_DATE - INTERVAL '10 days', 3500.00, 'UPI', 'State Electricity Board', 'MTR-994821', 'Monthly shop electricity bill', 'admin'
FROM expense_categories c WHERE c.name = 'Electricity & Utilities' LIMIT 1;

INSERT INTO expenses (voucher_number, category_id, expense_date, amount, payment_mode, recipient_name, reference_number, notes, created_by)
SELECT 
    'EXP-2026-0002', c.id, CURRENT_DATE - INTERVAL '5 days', 450.00, 'CASH', 'Express Courier Services', 'CN-88219', 'Urgent medicine consignment delivery', 'admin'
FROM expense_categories c WHERE c.name = 'Freight & Delivery' LIMIT 1;

-- 5. SEED SAMPLE CUSTOMER RECEIPT & SUPPLIER DISBURSEMENT
INSERT INTO payments (receipt_number, payment_type, customer_id, supplier_id, payment_date, amount, payment_mode, reference_number, notes, created_by)
SELECT 
    'REC-2026-0001', 'CUSTOMER_RECEIPT', c.id, NULL, CURRENT_DATE - INTERVAL '1 day', 200.00, 'UPI', 'UPI/29481920/HDFC', 'Part payment for medicine credit dues', 'staff'
FROM customers c WHERE c.name = 'Rajesh Sharma' LIMIT 1;

INSERT INTO payments (receipt_number, payment_type, customer_id, supplier_id, payment_date, amount, payment_mode, reference_number, notes, created_by)
SELECT 
    'PAY-2026-0001', 'SUPPLIER_PAYMENT', NULL, s.id, CURRENT_DATE - INTERVAL '3 days', 5000.00, 'BANK_TRANSFER', 'NEFT-AXIS-99210', 'Part clearance of invoice INV-METRO-9912', 'admin'
FROM suppliers s WHERE s.name = 'Metro Pharma Distributors' LIMIT 1;

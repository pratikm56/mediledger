-- ==============================================================================
-- Flyway Migration: V6__purchases.sql
-- Description: Inward Purchase Management and Supplier Invoice Intake
-- ==============================================================================

-- 1. PURCHASES TABLE
CREATE TABLE purchases (
    id BIGSERIAL PRIMARY KEY,
    purchase_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_invoice_number VARCHAR(100),
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    payment_status VARCHAR(30) NOT NULL, -- PAID, PARTIAL, UNPAID
    payment_mode VARCHAR(30), -- CASH, UPI, BANK_TRANSFER, CHEQUE, CREDIT
    notes VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX idx_purchases_date ON purchases(purchase_date);
CREATE INDEX idx_purchases_num ON purchases(purchase_number);
CREATE INDEX idx_purchases_status ON purchases(payment_status);

-- 2. PURCHASE ITEMS TABLE
CREATE TABLE purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id BIGINT NOT NULL REFERENCES purchases(id) ON DELETE RESTRICT,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    free_quantity INTEGER NOT NULL DEFAULT 0 CHECK (free_quantity >= 0),
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_medicine ON purchase_items(medicine_id);
CREATE INDEX idx_purchase_items_batch ON purchase_items(batch_id);

-- 3. SEED INITIAL HISTORICAL PURCHASES
INSERT INTO purchases (purchase_number, supplier_invoice_number, supplier_id, purchase_date, subtotal, tax_amount, discount_amount, total_amount, paid_amount, payment_status, payment_mode, notes, created_by)
SELECT 
    'PUR-2026-0001', 'INV-METRO-9912', s.id, CURRENT_DATE - INTERVAL '15 days', 13000.00, 1560.00, 60.00, 14500.00, 0.00, 'UNPAID', 'CREDIT', 'Stock intake of Paracetamol and Amoxicillin', 'admin'
FROM suppliers s WHERE s.name = 'Metro Pharma Distributors' LIMIT 1;

-- Link items for seeded purchase
INSERT INTO purchase_items (purchase_id, medicine_id, batch_id, batch_number, expiry_date, manufacturing_date, quantity, free_quantity, purchase_price, mrp, selling_price, gst_percentage, tax_amount, total_amount)
SELECT 
    p.id, b.medicine_id, b.id, b.batch_number, b.expiry_date, b.manufacturing_date, 100, 0, 14.50, 20.00, 20.00, 12.00, 174.00, 1624.00
FROM purchases p, medicine_batches b 
WHERE p.purchase_number = 'PUR-2026-0001' AND b.batch_number = 'PARA-2026A'
LIMIT 1;

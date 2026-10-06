-- ==============================================================================
-- Flyway Migration: V7__sales.sql
-- Description: Retail Sales, Billing & POS System for Pharmacy Dispensing
-- ==============================================================================

-- 1. SALES TABLE
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20),
    doctor_name VARCHAR(150),
    sale_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    round_off NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    change_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (change_amount >= 0),
    payment_status VARCHAR(30) NOT NULL, -- PAID, PARTIAL, UNPAID
    payment_mode VARCHAR(30) NOT NULL,   -- CASH, UPI, CARD, CREDIT
    notes VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sales_status ON sales(payment_status);
CREATE INDEX idx_sales_created ON sales(created_at);

-- 2. SALE ITEMS TABLE
CREATE TABLE sale_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
    mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0)
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_medicine ON sale_items(medicine_id);
CREATE INDEX idx_sale_items_batch ON sale_items(batch_id);

-- 3. SEED INITIAL HISTORICAL SALE
INSERT INTO sales (invoice_number, customer_id, customer_name, customer_phone, doctor_name, sale_date, subtotal, tax_amount, discount_amount, round_off, total_amount, paid_amount, change_amount, payment_status, payment_mode, notes, created_by)
SELECT 
    'BILL-2026-0001', c.id, c.name, c.phone, 'Dr. A. K. Sharma', CURRENT_DATE - INTERVAL '2 days', 50.00, 6.00, 0.00, 0.00, 56.00, 56.00, 0.00, 'PAID', 'CASH', 'Initial OTC dispensing', 'staff'
FROM customers c WHERE c.name = 'Rajesh Sharma' LIMIT 1;

-- Seed sale item
INSERT INTO sale_items (sale_id, medicine_id, batch_id, batch_number, expiry_date, quantity, unit_price, mrp, purchase_price, gst_percentage, tax_amount, discount_amount, total_amount)
SELECT 
    s.id, b.medicine_id, b.id, b.batch_number, b.expiry_date, 2, b.selling_price, b.mrp, b.purchase_price, b.gst_percentage, 4.80, 0.00, 44.80
FROM sales s, medicine_batches b 
WHERE s.invoice_number = 'BILL-2026-0001' AND b.batch_number = 'PARA-2026A'
LIMIT 1;

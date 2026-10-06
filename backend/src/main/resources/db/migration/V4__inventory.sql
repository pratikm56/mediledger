-- ==============================================================================
-- Flyway Migration: V4__inventory.sql
-- Description: Medicine Batches, Inventory Management, and Stock Transactions
-- ==============================================================================

-- 1. MEDICINE BATCHES TABLE
CREATE TABLE medicine_batches (
    id BIGSERIAL PRIMARY KEY,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_number VARCHAR(50) NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    purchase_price NUMERIC(12, 2) NOT NULL CHECK (purchase_price >= 0),
    mrp NUMERIC(12, 2) NOT NULL CHECK (mrp >= 0),
    selling_price NUMERIC(12, 2) NOT NULL CHECK (selling_price >= 0),
    gst_percentage NUMERIC(5, 2) NOT NULL DEFAULT 12.00 CHECK (gst_percentage >= 0),
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

-- Indexes for batch lookups and expiry searches
CREATE INDEX idx_batches_medicine ON medicine_batches(medicine_id);
CREATE INDEX idx_batches_expiry ON medicine_batches(expiry_date);
CREATE INDEX idx_batches_qty ON medicine_batches(quantity);
CREATE INDEX idx_batches_batch_num ON medicine_batches(batch_number);

-- 2. STOCK TRANSACTIONS (AUDIT TRAIL)
CREATE TABLE stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    medicine_id BIGINT NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id BIGINT NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL, -- PURCHASE, SALE, SALE_RETURN, PURCHASE_RETURN, ADJUSTMENT, DAMAGED, EXPIRED
    quantity_change INTEGER NOT NULL, -- Positive for stock in, Negative for stock out
    quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
    reference_type VARCHAR(50), -- INITIAL_STOCK, PURCHASE_INVOICE, SALE_BILL, MANUAL_ADJUSTMENT, EXPIRY_DISPOSAL
    reference_id VARCHAR(100),
    notes VARCHAR(255),
    created_by VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_tx_medicine ON stock_transactions(medicine_id);
CREATE INDEX idx_stock_tx_batch ON stock_transactions(batch_id);
CREATE INDEX idx_stock_tx_created ON stock_transactions(created_at);
CREATE INDEX idx_stock_tx_type ON stock_transactions(transaction_type);

-- 3. SEED BATCHES & INITIAL STOCK TRANSACTIONS
-- Paracetamol 500mg Batches
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'PARA-2026A', CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '500 days', 14.50, 20.00, 20.00, 12.00, 100
FROM medicines m WHERE m.name = 'Paracetamol 500mg' LIMIT 1;

INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'PARA-2025-NEAR', CURRENT_DATE - INTERVAL '300 days', CURRENT_DATE + INTERVAL '25 days', 14.00, 20.00, 20.00, 12.00, 15
FROM medicines m WHERE m.name = 'Paracetamol 500mg' LIMIT 1;

-- Amoxicillin 500mg Batches
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'AMX-9901', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '400 days', 65.00, 90.00, 85.00, 12.00, 50
FROM medicines m WHERE m.name = 'Amoxicillin 500mg' LIMIT 1;

-- Cetirizine 10mg Batches (Low stock test case: 6 units vs min stock 10)
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'CET-551', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE + INTERVAL '600 days', 18.00, 28.00, 28.00, 12.00, 6
FROM medicines m WHERE m.name = 'Cetirizine 10mg' LIMIT 1;

-- Cough Relief Syrup Batches (One expired batch, one valid batch)
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'CR-EXP-01', CURRENT_DATE - INTERVAL '400 days', CURRENT_DATE - INTERVAL '10 days', 50.00, 75.00, 75.00, 12.00, 4
FROM medicines m WHERE m.name = 'Cough Relief Syrup 100ml' LIMIT 1;

INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'CR-FRESH-02', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE + INTERVAL '350 days', 55.00, 80.00, 80.00, 12.00, 35
FROM medicines m WHERE m.name = 'Cough Relief Syrup 100ml' LIMIT 1;

-- Pantoprazole 40mg Batches
INSERT INTO medicine_batches (medicine_id, batch_number, manufacturing_date, expiry_date, purchase_price, mrp, selling_price, gst_percentage, quantity)
SELECT 
    m.id, 'PAN-440', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE + INTERVAL '450 days', 80.00, 115.00, 110.00, 12.00, 45
FROM medicines m WHERE m.name = 'Pantoprazole 40mg' LIMIT 1;

-- Record Initial Seed Stock Transactions in Audit Trail
INSERT INTO stock_transactions (medicine_id, batch_id, transaction_type, quantity_change, quantity_after, reference_type, reference_id, notes, created_by)
SELECT 
    b.medicine_id, b.id, 'PURCHASE', b.quantity, b.quantity, 'INITIAL_STOCK', 'INIT-SEED', 'Initial pharmacy inventory setup', 'system'
FROM medicine_batches b;

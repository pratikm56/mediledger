-- ==============================================================================
-- Flyway Migration: V9__reports.sql
-- Description: Composite Indexes and Reporting Views for Pharmacy Analytics
-- ==============================================================================

-- 1. PERFORMANCE INDEXES FOR REPORTING QUERIES
CREATE INDEX IF NOT EXISTS idx_sales_date_status ON sales(sale_date, payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_date_status ON purchases(purchase_date, payment_status);
CREATE INDEX IF NOT EXISTS idx_expenses_date_category ON expenses(expense_date, category_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry_qty ON medicine_batches(expiry_date, quantity);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_medicine ON sale_items(sale_id, medicine_id);
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(current_balance);
CREATE INDEX IF NOT EXISTS idx_suppliers_balance ON suppliers(current_balance);

-- 2. DETAILED STOCK INVENTORY VIEW
CREATE OR REPLACE VIEW v_detailed_stock AS
SELECT 
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.generic_name,
    c.name AS category_name,
    mf.name AS manufacturer_name,
    m.unit,
    m.pack_size,
    m.minimum_stock,
    b.id AS batch_id,
    b.batch_number,
    b.expiry_date,
    b.quantity,
    b.purchase_price,
    b.mrp,
    b.selling_price,
    (b.quantity * b.purchase_price) AS purchase_value,
    (b.quantity * b.mrp) AS mrp_value,
    CASE 
        WHEN b.quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN b.quantity <= m.minimum_stock THEN 'LOW_STOCK'
        ELSE 'NORMAL'
    END AS stock_status,
    CASE 
        WHEN b.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN b.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'EXPIRING_SOON'
        ELSE 'NORMAL'
    END AS expiry_status,
    m.active AS medicine_active
FROM medicines m
JOIN categories c ON m.category_id = c.id
LEFT JOIN manufacturers mf ON m.manufacturer_id = mf.id
JOIN medicine_batches b ON b.medicine_id = m.id;

-- 3. CUSTOMER OUTSTANDING AGGREGATION VIEW
CREATE OR REPLACE VIEW v_customer_outstanding AS
SELECT 
    c.id AS customer_id,
    c.name AS customer_name,
    c.phone AS customer_phone,
    c.doctor_name,
    c.current_balance AS outstanding_balance,
    COALESCE(SUM(s.total_amount), 0) AS total_invoiced,
    COALESCE(SUM(s.paid_amount), 0) AS total_paid,
    COUNT(s.id) AS total_bills_count
FROM customers c
LEFT JOIN sales s ON s.customer_id = c.id
WHERE c.active = TRUE
GROUP BY c.id, c.name, c.phone, c.doctor_name, c.current_balance;

-- 4. SUPPLIER OUTSTANDING AGGREGATION VIEW
CREATE OR REPLACE VIEW v_supplier_outstanding AS
SELECT 
    sp.id AS supplier_id,
    sp.name AS supplier_name,
    sp.phone AS supplier_phone,
    sp.contact_person,
    sp.gst_number,
    sp.current_balance AS outstanding_balance,
    COALESCE(SUM(p.total_amount), 0) AS total_invoiced,
    COALESCE(SUM(p.paid_amount), 0) AS total_paid,
    COUNT(p.id) AS total_purchases_count
FROM suppliers sp
LEFT JOIN purchases p ON p.supplier_id = sp.id
WHERE sp.active = TRUE
GROUP BY sp.id, sp.name, sp.phone, sp.contact_person, sp.gst_number, sp.current_balance;

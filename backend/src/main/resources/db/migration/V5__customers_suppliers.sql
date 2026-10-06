-- ==============================================================================
-- Flyway Migration: V5__customers_suppliers.sql
-- Description: Customer and Supplier Management with Outstanding Balances
-- ==============================================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    doctor_name VARCHAR(150),
    gst_number VARCHAR(20),
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Positive indicates customer owes money to shop (receivable)
    credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (credit_limit >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_active ON customers(active);
CREATE INDEX idx_customers_balance ON customers(current_balance);

-- 2. SUPPLIERS TABLE
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address VARCHAR(255),
    gst_number VARCHAR(20),
    drug_license_number VARCHAR(50),
    opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    current_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Positive indicates shop owes money to supplier (payable)
    payment_terms_days INTEGER NOT NULL DEFAULT 30 CHECK (payment_terms_days >= 0),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_phone ON suppliers(phone);
CREATE INDEX idx_suppliers_gst ON suppliers(gst_number);
CREATE INDEX idx_suppliers_active ON suppliers(active);
CREATE INDEX idx_suppliers_balance ON suppliers(current_balance);

-- 3. SEED INITIAL CUSTOMERS
INSERT INTO customers (name, phone, email, address, doctor_name, gst_number, opening_balance, current_balance, credit_limit, active) VALUES
    ('Walk-in Customer', '0000000000', NULL, 'Counter Sales', NULL, NULL, 0.00, 0.00, 0.00, TRUE),
    ('Rajesh Sharma', '9820123456', 'rajesh.sharma@gmail.com', '102, Shanti Heights, M.G. Road', 'Dr. A. K. Gupta', NULL, 0.00, 350.00, 2000.00, TRUE),
    ('Priya Patel', '9879543210', 'priya.patel@yahoo.com', 'B-4, Royal Palms, Station Road', 'Dr. Meena Joshi', NULL, 0.00, 0.00, 1000.00, TRUE),
    ('Amit Verma', '9811223344', 'amit.verma@outlook.com', '45, Civil Lines, Central Market', 'Dr. S. K. Roy', NULL, 150.00, 650.00, 3000.00, TRUE),
    ('Apollo Home Health', '9845098450', 'billing@apollohome.local', 'Plot 12, Sector 4, Tech Zone', 'Dr. R. K. Nair', '27AABCA1234F1Z5', 0.00, 1200.00, 10000.00, TRUE);

-- 4. SEED INITIAL SUPPLIERS / DISTRIBUTORS
INSERT INTO suppliers (name, contact_person, phone, email, address, gst_number, drug_license_number, opening_balance, current_balance, payment_terms_days, active) VALUES
    ('Metro Pharma Distributors', 'Suresh Kumar', '9821098210', 'orders@metropharma.local', 'G-14, Dawa Bazaar, Wholesale Market, Mumbai', '27AABCM5678F1ZQ', 'DL-20B-MH-12345', 0.00, 14500.00, 30, TRUE),
    ('National Medical Agency', 'Vikas Singhal', '9810098100', 'vikas@nationalmed.local', 'Shop 22, Pharma Arcade, Sadar, Delhi', '07AACCN9012D1Z8', 'DL-20B-DL-67890', 0.00, 8200.00, 21, TRUE),
    ('Apex Healthcare Supplies', 'Ramesh Shah', '9825098250', 'sales@apexhealth.local', '301, Commerce Hub, Ring Road, Ahmedabad', '24AABCA3456K1Z2', 'DL-21B-GJ-45678', 0.00, 0.00, 45, TRUE),
    ('Medica Drug House', 'Deepak Rao', '9844098440', 'deepak@medicadrug.local', '18, Brigade Link Road, Bengaluru', '29AADCM7890L1ZP', 'DL-20B-KA-98765', 5000.00, 5000.00, 15, TRUE);

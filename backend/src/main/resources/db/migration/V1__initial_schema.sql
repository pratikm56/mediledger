-- ==============================================================================
-- MediLedger Database Migration: V1__initial_schema.sql
-- Foundation Schema: Roles, Users, User Roles, Business Settings, Audit Logs
-- ==============================================================================

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. USER_ROLES JUNCTION TABLE
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

-- 4. BUSINESS_SETTINGS TABLE
CREATE TABLE IF NOT EXISTS business_settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- INITIAL SEED DATA FOR ROLES
INSERT INTO roles (name, description) VALUES
    ('ROLE_OWNER', 'Shop Owner with full unrestricted access'),
    ('ROLE_ADMIN', 'Shop Manager / Administrator with management access'),
    ('ROLE_STAFF', 'Shop Staff / Cashier with billing and stock viewing access')
ON CONFLICT (name) DO NOTHING;

-- INITIAL SEED DATA FOR BUSINESS SETTINGS
INSERT INTO business_settings (setting_key, setting_value, description) VALUES
    ('shop_name', 'MediLedger Pharmacy', 'Medical Shop Name'),
    ('shop_address', 'Shop #12, Health Avenue, Medical Square', 'Shop Physical Address'),
    ('shop_phone', '+91 9876543210', 'Primary Contact Phone'),
    ('shop_email', 'contact@mediledger.local', 'Primary Contact Email'),
    ('gstin', '27AAAAA0000A1Z5', 'Goods and Services Tax Identification Number'),
    ('invoice_prefix', 'ML-INV-', 'Prefix for generated sales invoices'),
    ('invoice_counter', '1001', 'Sequential invoice number tracker'),
    ('currency', 'INR', 'Default transaction currency'),
    ('currency_symbol', '₹', 'Currency Symbol'),
    ('default_gst_rate', '12', 'Default GST percentage for medicines'),
    ('invoice_footer', 'Thank you for your visit. Get well soon!', 'Printed footer message on bills')
ON CONFLICT (setting_key) DO NOTHING;

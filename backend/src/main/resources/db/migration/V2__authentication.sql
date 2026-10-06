-- ==============================================================================
-- MediLedger Database Migration: V2__authentication.sql
-- Seed Initial Security Users & Role Mappings
-- ==============================================================================

-- 1. SEED DEFAULT USERS (Passwords hashed with BCrypt 10 rounds)
-- Owner password: Owner@123
-- Admin password: Admin@123
-- Staff password: Staff@123

INSERT INTO users (username, email, password_hash, full_name, phone, active, created_at, updated_at)
VALUES
    ('owner', 'owner@mediledger.local', '$2a$10$9pdiIxsMXq8zycAg6H9BUOB.POnov/RvOQyHI2P.7BAPtgrL63Gx2', 'Dr. MediLedger Owner', '+91 9876543210', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('admin', 'admin@mediledger.local', '$2a$10$Ukr7aVvff2WoRGECtLhd3uJ37sV2lRN4SMtuI6gaWP6xUbLSRmz1y', 'Pharmacy Manager Admin', '+91 9876543211', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('staff', 'staff@mediledger.local', '$2a$10$2nkxWUrOgNQOquYuC.xLFOd0FmrKwyNkBRK4vfQoG2JUHLU7SwdKG', 'Counter Cashier Staff', '+91 9876543212', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- 2. MAP USERS TO ROLES
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'owner' AND r.name = 'ROLE_OWNER'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'staff' AND r.name = 'ROLE_STAFF'
ON CONFLICT DO NOTHING;

-- 3. AUDIT LOG RECORD FOR SYSTEM SEED
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, created_at)
SELECT id, 'SYSTEM_INIT', 'SYSTEM', '1', 'Initial default users and roles seeded for MediLedger', '127.0.0.1', CURRENT_TIMESTAMP
FROM users WHERE username = 'owner'
LIMIT 1;

-- ==============================================================================
-- Flyway Migration: V10__audit_logs.sql
-- Description: Audit Logging Performance Indexes and Business Settings Extension
-- ==============================================================================

-- 1. COMPOSITE INDEXES FOR AUDIT LOG SEARCH AND COMPLIANCE AUDITING
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON audit_logs(action, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 2. ENSURE OWNER_NAME IN BUSINESS SETTINGS
INSERT INTO business_settings (setting_key, setting_value, description) VALUES
    ('owner_name', 'Rajesh Patel', 'Pharmacy Owner / License Holder Name')
ON CONFLICT (setting_key) DO NOTHING;

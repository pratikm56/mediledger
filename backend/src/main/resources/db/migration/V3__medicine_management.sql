-- ==============================================================================
-- MediLedger Database Migration: V3__medicine_management.sql
-- Medicine Management: Categories, Manufacturers, Medicines & Initial Seed Data
-- ==============================================================================

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. MANUFACTURERS TABLE
CREATE TABLE IF NOT EXISTS manufacturers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    contact VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. MEDICINES TABLE
CREATE TABLE IF NOT EXISTS medicines (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150),
    category_id BIGINT NOT NULL,
    manufacturer_id BIGINT NOT NULL,
    hsn_code VARCHAR(20),
    gst_percentage NUMERIC(5, 2) DEFAULT 12.00 NOT NULL,
    unit VARCHAR(50) DEFAULT 'Strip' NOT NULL,
    pack_size VARCHAR(50) DEFAULT '10 Tablets',
    prescription_required BOOLEAN DEFAULT FALSE NOT NULL,
    minimum_stock INTEGER DEFAULT 10 NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_medicines_category FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
    CONSTRAINT fk_medicines_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers (id) ON DELETE RESTRICT
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_manufacturers_name ON manufacturers(name);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_generic_name ON medicines(generic_name);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id ON medicines(category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_manufacturer_id ON medicines(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(active);

-- SEED DEFAULT CATEGORIES
INSERT INTO categories (name, description, active) VALUES
    ('Tablets', 'Solid dosage forms containing medicinal substances', TRUE),
    ('Capsules', 'Medicines enclosed in a gelatin shell', TRUE),
    ('Syrups', 'Concentrated liquid medicinal solutions', TRUE),
    ('Injections', 'Sterile injectable pharmaceutical liquids', TRUE),
    ('Creams', 'Topical semi-solid emulsions', TRUE),
    ('Ointments', 'Topical semi-solid oil-based preparations', TRUE),
    ('Drops', 'Ophthalmic or pediatric liquid drops', TRUE),
    ('Powders', 'Fine medicinal particulate preparations', TRUE),
    ('Other', 'Miscellaneous medical items and devices', TRUE)
ON CONFLICT (name) DO NOTHING;

-- SEED REPUTABLE MANUFACTURERS
INSERT INTO manufacturers (name, contact, email, address, active) VALUES
    ('Cipla Ltd', '+91 22 2482 6000', 'contact@cipla.com', 'Cipla House, Peninsula Business Park, Mumbai', TRUE),
    ('Sun Pharma Laboratories', '+91 22 4324 4324', 'info@sunpharma.com', 'Sun Pharma House, Goregaon, Mumbai', TRUE),
    ('Dr. Reddy''s Laboratories', '+91 40 4900 2900', 'info@drreddys.com', '8-2-337, Road No. 3, Banjara Hills, Hyderabad', TRUE),
    ('Abbott Healthcare', '+91 22 3816 2000', 'support@abbott.in', 'Godrej BKC, Bandra Kurla Complex, Mumbai', TRUE),
    ('Mankind Pharma', '+91 11 2088 1200', 'contact@mankindpharma.com', '208, Okhla Industrial Estate, Phase III, New Delhi', TRUE),
    ('Alkem Laboratories', '+91 22 3982 9999', 'contact@alkem.com', 'Alkem House, Senapati Bapat Marg, Lower Parel, Mumbai', TRUE)
ON CONFLICT (name) DO NOTHING;

-- SEED STANDARD MEDICINES
INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Paracetamol 500mg', 'Paracetamol', c.id, m.id, '300490', 12.00, 'Strip', '10 Tablets', FALSE, 20, 'Antipyretic and analgesic for fever and mild to moderate pain relief', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Tablets' AND m.name = 'Cipla Ltd'
LIMIT 1;

INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Amoxicillin 500mg', 'Amoxicillin Trihydrate', c.id, m.id, '300410', 12.00, 'Strip', '10 Capsules', TRUE, 15, 'Broad-spectrum penicillin antibiotic for bacterial infections', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Capsules' AND m.name = 'Sun Pharma Laboratories'
LIMIT 1;

INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Cetirizine 10mg', 'Cetirizine Dihydrochloride', c.id, m.id, '300490', 12.00, 'Strip', '10 Tablets', FALSE, 10, 'Second-generation antihistamine for allergic rhinitis and hives', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Tablets' AND m.name = 'Dr. Reddy''s Laboratories'
LIMIT 1;

INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Cough Relief Syrup 100ml', 'Dextromethorphan + Chlorpheniramine', c.id, m.id, '300490', 12.00, 'Bottle', '100ml', FALSE, 8, 'Antitussive and antihistamine syrup for dry cough relief', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Syrups' AND m.name = 'Abbott Healthcare'
LIMIT 1;

INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Pantoprazole 40mg', 'Pantoprazole Sodium', c.id, m.id, '300490', 12.00, 'Strip', '10 Tablets', FALSE, 15, 'Proton pump inhibitor for acidity and gastroesophageal reflux', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Tablets' AND m.name = 'Mankind Pharma'
LIMIT 1;

INSERT INTO medicines (name, generic_name, category_id, manufacturer_id, hsn_code, gst_percentage, unit, pack_size, prescription_required, minimum_stock, description, active)
SELECT
    'Betadine 5% Ointment 20g', 'Povidone Iodine 5%', c.id, m.id, '300490', 12.00, 'Tube', '20g', FALSE, 10, 'Antiseptic ointment for treatment of minor wounds and burns', TRUE
FROM categories c, manufacturers m
WHERE c.name = 'Ointments' AND m.name = 'Alkem Laboratories'
LIMIT 1;

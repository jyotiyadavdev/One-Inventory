-- Create database
CREATE DATABASE onebill_dev;

\c onebill_dev;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff',
    tenant_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE assets (
    id SERIAL PRIMARY KEY,
    asset_tag VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    purchase_date DATE,
    purchase_cost DECIMAL(10,2),
    warranty_expiry DATE,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),
    qr_code TEXT,
    tenant_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'new',
    asset_id INTEGER REFERENCES assets(id),
    reported_by INTEGER REFERENCES users(id),
    assigned_to INTEGER REFERENCES users(id),
    location VARCHAR(255),
    sla_response_due TIMESTAMP,
    sla_resolution_due TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    tenant_id INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ticket comments
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (email, password_hash, full_name, role) VALUES 
('admin@pfg.com', '$2a$10$YourHashedPasswordHere', 'System Admin', 'admin'),
('facilities@pfg.com', '$2a$10$YourHashedPasswordHere', 'Facilities Manager', 'manager'),
('tech@pfg.com', '$2a$10$YourHashedPasswordHere', 'Maintenance Tech', 'staff');

-- Sample assets
INSERT INTO assets (asset_tag, name, category, location, status, purchase_date, purchase_cost, warranty_expiry, manufacturer, model) VALUES 
('AC-001', 'HVAC Unit - Building A', 'HVAC', 'Building A - Roof', 'active', '2023-01-15', 12500.00, '2028-01-15', 'Carrier', '48TC-D07'),
('AC-002', 'HVAC Unit - Building B', 'HVAC', 'Building B - Roof', 'active', '2023-03-20', 11800.00, '2028-03-20', 'Trane', 'YCD060'),
('EL-001', 'Main Electrical Panel', 'Electrical', 'Building A - Basement', 'active', '2022-06-10', 3500.00, '2027-06-10', 'Siemens', 'P1-400A'),
('IT-001', 'Server Rack - Core Switch', 'IT', 'Server Room', 'active', '2024-01-05', 4200.00, '2029-01-05', 'Cisco', 'Catalyst 9300');

-- Sample tickets
INSERT INTO tickets (ticket_number, title, description, category, priority, status, asset_id, location) VALUES 
('TKT-001', 'AC not cooling properly', 'Building A AC is blowing warm air', 'HVAC', 'high', 'new', 1, 'Building A'),
('TKT-002', 'Flickering lights', 'Lights in corridor keep flickering', 'Electrical', 'medium', 'in_progress', 3, 'Building A - 2nd Floor'),
('TKT-003', 'Network outage', 'Unable to connect to internet', 'IT', 'critical', 'assigned', 4, 'Server Room');
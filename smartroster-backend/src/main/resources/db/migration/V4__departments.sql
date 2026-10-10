-- SmartRoster Database Schema
-- V4: Departments Management Schema for Admin Configuration

CREATE TABLE departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_departments_name ON departments(name);

-- Seed Initial Default Departments
INSERT INTO departments (name, description) VALUES
    ('Operations', 'Shift Operations, Logistics & Dispatch Handling'),
    ('Engineering & Management', 'Software, Hardware & Engineering Leadership'),
    ('IT & Security', 'Infrastructure, Information Security & SysAdmin'),
    ('Customer Support', '24/7 Client Assistance and Technical Support'),
    ('Logistics', 'Supply Chain, Inventory & Transport Coordination'),
    ('Quality Assurance', 'Process Validation, Auditing & Quality Control');

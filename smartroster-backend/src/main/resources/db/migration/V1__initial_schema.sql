-- SmartRoster Database Schema
-- V1: Initial schema

CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shift_configs (
    id BIGSERIAL PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    weekday_count INTEGER NOT NULL DEFAULT 0,
    weekend_count INTEGER NOT NULL DEFAULT 0,
    display_order INTEGER DEFAULT 0,
    color_code VARCHAR(20) DEFAULT '#4CAF50',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rosters (
    id BIGSERIAL PRIMARY KEY,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    weekly_off_per_employee INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_roster_month_year UNIQUE ("month", "year")
);

CREATE TABLE roster_assignments (
    id BIGSERIAL PRIMARY KEY,
    roster_id BIGINT NOT NULL REFERENCES rosters(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    assignment_date DATE NOT NULL,
    shift_name VARCHAR(100),
    is_weekly_off BOOLEAN NOT NULL DEFAULT FALSE,
    is_manual_edit BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uk_roster_emp_date UNIQUE (roster_id, employee_id, assignment_date)
);

CREATE INDEX idx_roster_assignments_roster ON roster_assignments(roster_id);
CREATE INDEX idx_roster_assignments_employee ON roster_assignments(employee_id);
CREATE INDEX idx_roster_assignments_date ON roster_assignments(assignment_date);

-- Default shift configurations
INSERT INTO shift_configs (shift_name, weekday_count, weekend_count, display_order, color_code) VALUES
('Morning', 3, 2, 1, '#4CAF50'),
('Evening', 2, 1, 2, '#2196F3'),
('Night', 2, 1, 3, '#9C27B0');

-- Sample employees
INSERT INTO employees (name) VALUES
('Rahul Sharma'),
('Priya Patel'),
('Amit Kumar'),
('Sneha Gupta'),
('Vikram Singh'),
('Neha Joshi'),
('Arjun Reddy'),
('Kavita Nair'),
('Rajesh Verma'),
('Meera Iyer'),
('Suresh Menon'),
('Deepa Krishnan');

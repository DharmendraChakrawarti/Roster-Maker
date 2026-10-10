-- SmartRoster Database Schema
-- V3: Multi-tenant Manager Isolated Rosters and Staff Relationship

-- 1. Extend users with manager reference (for Staff members to point to their Manager)
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);

-- 2. Extend rosters with manager ownership
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS manager_id BIGINT;
ALTER TABLE rosters ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_rosters_manager ON rosters(manager_id);

-- Drop the old global unique constraint on (month, year) so multiple managers can have rosters for the same month
ALTER TABLE rosters DROP CONSTRAINT IF EXISTS uk_roster_month_year;

-- 3. Extend employees with manager ownership
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id BIGINT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);

-- 4. Extend shift_configs with optional manager ownership
ALTER TABLE shift_configs ADD COLUMN IF NOT EXISTS manager_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_shift_configs_manager ON shift_configs(manager_id);

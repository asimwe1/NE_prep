-- Migration updates for the Fire Extinguisher Management System.

CREATE TABLE IF NOT EXISTS otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(30) NOT NULL DEFAULT 'password_reset'
        CHECK (purpose IN ('password_reset', 'email_verify')),
    is_used BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
CREATE INDEX IF NOT EXISTS idx_otps_expires ON otps(expires_at);

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'inspector', 'user'));

ALTER TABLE users
    ALTER COLUMN role SET DEFAULT 'user';

ALTER TABLE extinguishers
    ALTER COLUMN type TYPE VARCHAR(30);

ALTER TABLE extinguishers
    DROP CONSTRAINT IF EXISTS extinguishers_type_check;

ALTER TABLE extinguishers
    ADD CONSTRAINT extinguishers_type_check
    CHECK (type IN ('Water', 'CO2', 'Foam', 'Dry Chemical'));

ALTER TABLE extinguishers
    ADD COLUMN IF NOT EXISTS size VARCHAR(20) NOT NULL DEFAULT '5 lb';

ALTER TABLE extinguishers
    ADD COLUMN IF NOT EXISTS installation_date DATE NOT NULL DEFAULT CURRENT_DATE;

ALTER TABLE extinguishers
    ALTER COLUMN capacity_liters DROP NOT NULL;

ALTER TABLE inspections
    ADD COLUMN IF NOT EXISTS inspection_time TIME;

ALTER TABLE inspections
    DROP CONSTRAINT IF EXISTS inspections_status_check;

ALTER TABLE inspections
    ADD CONSTRAINT inspections_status_check
    CHECK (status IN ('Scheduled', 'Completed', 'Requires Service', 'Failed'));

ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS action_taken VARCHAR(255);

ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS issues_identified TEXT;

ALTER TABLE maintenance
    ADD COLUMN IF NOT EXISTS recommendations TEXT;

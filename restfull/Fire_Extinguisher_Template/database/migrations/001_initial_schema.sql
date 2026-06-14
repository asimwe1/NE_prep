-- Fire Extinguisher Management System
-- Migration: 001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (customers + staff/admin)
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  phone         VARCHAR(20) NOT NULL,
  national_id   VARCHAR(30) UNIQUE NOT NULL,
  address       TEXT,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','staff','admin')),
  password_hash VARCHAR(255) NOT NULL,
  is_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP codes for email verification & login
CREATE TABLE IF NOT EXISTS otp_codes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code       VARCHAR(6) NOT NULL,
  purpose    VARCHAR(30) NOT NULL CHECK (purpose IN ('registration','login','password_reset')),
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  attempts   INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extinguisher purchase records
CREATE TABLE IF NOT EXISTS extinguishers (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  serial_numbers TEXT[],
  purchase_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date    DATE NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','expiring_soon','expired','renewed','escalated')),
  notes          TEXT,
  created_by     UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification records
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extinguisher_id  UUID NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  customer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             VARCHAR(30) NOT NULL
                   CHECK (type IN ('expiry_30days','expiry_14days','expiry_7days','expiry_1day','expired')),
  status           VARCHAR(20) NOT NULL DEFAULT 'sent'
                   CHECK (status IN ('sent','delivered','acknowledged','failed')),
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at  TIMESTAMPTZ,
  email_message_id VARCHAR(255)
);

-- Escalation records
CREATE TABLE IF NOT EXISTS escalations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  extinguisher_id  UUID NOT NULL REFERENCES extinguishers(id) ON DELETE CASCADE,
  reason           TEXT NOT NULL,
  status           VARCHAR(20) NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open','in_review','notified_authority','resolved','closed')),
  authority_ref    VARCHAR(100),
  notes            TEXT,
  escalated_by     UUID REFERENCES users(id),
  escalated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id),
  action     VARCHAR(100) NOT NULL,
  entity     VARCHAR(50),
  entity_id  UUID,
  metadata   JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_users_national_id    ON users(national_id);
CREATE INDEX idx_otp_user_purpose     ON otp_codes(user_id, purpose);
CREATE INDEX idx_ext_customer         ON extinguishers(customer_id);
CREATE INDEX idx_ext_expiry           ON extinguishers(expiry_date);
CREATE INDEX idx_ext_status           ON extinguishers(status);
CREATE INDEX idx_notif_customer       ON notifications(customer_id);
CREATE INDEX idx_notif_status         ON notifications(status);
CREATE INDEX idx_esc_customer         ON escalations(customer_id);
CREATE INDEX idx_esc_status           ON escalations(status);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ext_updated
  BEFORE UPDATE ON extinguishers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_esc_updated
  BEFORE UPDATE ON escalations FOR EACH ROW EXECUTE FUNCTION update_updated_at();

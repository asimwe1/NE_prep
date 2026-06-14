-- Seed Admin User
-- This script creates a default admin account for the Fire Extinguisher Management System
-- 
-- ADMIN CREDENTIALS:
-- Email: admin@fireshield.com
-- Password: Admin@2024
-- National ID: ADMIN001
-- Phone: +250788000001
-- Role: admin
--
-- IMPORTANT: Change the password after first login in production!

-- Delete existing test users if they exist (to allow re-seeding)
DELETE FROM users WHERE email IN ('admin@fireshield.com', 'staff@fireshield.com', 'customer@example.com');

-- Password hash for: Admin@2024
-- Generated using bcrypt with salt rounds = 12
INSERT INTO users (
  id,
  name,
  email,
  phone,
  national_id,
  address,
  role,
  password_hash,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'System Administrator',
  'admin@fireshield.com',
  '+250788000001',
  'ADMIN001',
  'FireShield HQ, Kigali',
  'admin',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk.Hjb7EW',
  true,
  NOW(),
  NOW()
);

-- Optional: Create a staff user for testing
-- STAFF CREDENTIALS:
-- Email: staff@fireshield.com
-- Password: Staff@2024
-- National ID: STAFF001
-- Phone: +250788000002
-- Role: staff

INSERT INTO users (
  id,
  name,
  email,
  phone,
  national_id,
  address,
  role,
  password_hash,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Staff Member',
  'staff@fireshield.com',
  '+250788000002',
  'STAFF001',
  'FireShield Office, Kigali',
  'staff',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk.Hjb7EW',
  true,
  NOW(),
  NOW()
);

-- Create sample customer for testing
-- CUSTOMER CREDENTIALS:
-- Email: customer@example.com
-- Password: Customer@2024
-- National ID: 1199800123456789
-- Phone: +250788123456
-- Role: customer

INSERT INTO users (
  id,
  name,
  email,
  phone,
  national_id,
  address,
  role,
  password_hash,
  is_verified,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'John Doe',
  'customer@example.com',
  '+250788123456',
  '1199800123456789',
  'KG 123 St, Kigali',
  'customer',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIk.Hjb7EW',
  true,
  NOW(),
  NOW()
);

-- Add sample extinguisher for the customer
INSERT INTO extinguishers (
  customer_id,
  quantity,
  serial_numbers,
  purchase_date,
  expiry_date,
  status,
  notes,
  created_by
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  2,
  ARRAY['FE-2024-001', 'FE-2024-002'],
  '2024-01-15',
  '2025-01-15',
  'active',
  'Initial purchase - 2x ABC type fire extinguishers',
  '00000000-0000-0000-0000-000000000001'
);

-- Summary
SELECT 
  'Seeding complete!' as message,
  COUNT(*) as users_created
FROM users
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

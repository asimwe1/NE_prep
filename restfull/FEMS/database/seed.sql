-- Idempotent starter data for a local FEMCS setup.
-- This script assumes femcs_db already exists.

INSERT INTO users (id, first_name, last_name, email, password, role, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'System', 'Admin', 'admin@femcs.rw', '$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC', 'admin', true),
    ('22222222-2222-2222-2222-222222222222', 'Grace', 'Inspector', 'inspector@femcs.rw', '$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC', 'inspector', true),
    ('33333333-3333-3333-3333-333333333333', 'Client', 'User', 'user@femcs.rw', '$2a$12$urR6RZtbMk.AVgPBZ2oxe.VUssoQyAHAVGMwKqJMKr5FJEOHQjiWC', 'user', true)
ON CONFLICT (email) DO UPDATE SET
    id = EXCLUDED.id,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    password = EXCLUDED.password,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

INSERT INTO customers (
    id,
    customer_code,
    full_name,
    national_id,
    phone,
    email,
    address,
    organization_name,
    is_active,
    created_by
)
VALUES
    (
        '44444444-4444-4444-4444-444444444444',
        'CUST-100001',
        'North Block Facility Manager',
        '1199980012345678',
        '+250788000111',
        'north.block@femcs.rw',
        'North Block, Kigali Industrial Zone',
        'North Block Industries',
        true,
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'CUST-100002',
        'Warehouse Safety Desk',
        '1199980098765432',
        '+250788000222',
        'warehouse.safety@femcs.rw',
        'Warehouse Park, Kigali Logistics Hub',
        'Warehouse Operations Ltd',
        true,
        '11111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (customer_code) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    national_id = EXCLUDED.national_id,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    address = EXCLUDED.address,
    organization_name = EXCLUDED.organization_name,
    is_active = EXCLUDED.is_active,
    created_by = EXCLUDED.created_by;

INSERT INTO extinguishers (
    id,
    extinguisher_code,
    serial_number,
    type,
    size,
    capacity_liters,
    manufacture_date,
    purchase_date,
    installation_date,
    expiry_date,
    last_inspection_date,
    next_inspection_date,
    location,
    customer_id,
    status,
    compliance_status,
    notes,
    created_by
)
VALUES
    (
        '66666666-6666-6666-6666-666666666666',
        'EXT-100001',
        'SN-CO2-2024-100001',
        'CO2',
        '5 lb',
        2.30,
        DATE '2024-01-15',
        DATE '2024-02-01',
        DATE '2024-02-05',
        DATE '2029-02-05',
        DATE '2026-05-15',
        DATE '2026-11-15',
        'North Block Ground Floor Reception',
        '44444444-4444-4444-4444-444444444444',
        'active',
        'compliant',
        'Starter compliant extinguisher for dashboard demos.',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'EXT-100002',
        'SN-DC-2024-100002',
        'Dry Chemical',
        '9 lb',
        4.10,
        DATE '2024-03-20',
        DATE '2024-04-01',
        DATE '2024-04-07',
        DATE '2028-04-07',
        DATE '2025-12-15',
        DATE '2026-06-20',
        'Warehouse A Loading Bay',
        '55555555-5555-5555-5555-555555555555',
        'pending_inspection',
        'warning',
        'Pending follow-up inspection after routine service.',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'EXT-100003',
        'SN-WTR-2020-100003',
        'Water',
        '12 lb',
        6.00,
        DATE '2020-01-10',
        DATE '2020-02-01',
        DATE '2020-02-10',
        DATE '2025-12-31',
        DATE '2025-12-01',
        DATE '2026-01-05',
        'Warehouse B Chemical Storage Corridor',
        '55555555-5555-5555-5555-555555555555',
        'expired',
        'non_compliant',
        'Expired unit kept as a sample for escalation and notification flows.',
        '11111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (extinguisher_code) DO UPDATE SET
    serial_number = EXCLUDED.serial_number,
    type = EXCLUDED.type,
    size = EXCLUDED.size,
    capacity_liters = EXCLUDED.capacity_liters,
    manufacture_date = EXCLUDED.manufacture_date,
    purchase_date = EXCLUDED.purchase_date,
    installation_date = EXCLUDED.installation_date,
    expiry_date = EXCLUDED.expiry_date,
    last_inspection_date = EXCLUDED.last_inspection_date,
    next_inspection_date = EXCLUDED.next_inspection_date,
    location = EXCLUDED.location,
    customer_id = EXCLUDED.customer_id,
    status = EXCLUDED.status,
    compliance_status = EXCLUDED.compliance_status,
    notes = EXCLUDED.notes,
    created_by = EXCLUDED.created_by;

INSERT INTO inspections (
    id,
    extinguisher_id,
    inspector_id,
    inspector_name,
    inspection_date,
    inspection_time,
    findings,
    status,
    next_inspection_date,
    created_by
)
VALUES
    (
        '99999999-9999-9999-9999-999999999991',
        '66666666-6666-6666-6666-666666666666',
        '22222222-2222-2222-2222-222222222222',
        'Grace Inspector',
        DATE '2026-05-15',
        TIME '10:00',
        'Pressure gauge normal, seal intact, and signage visible.',
        'Completed',
        DATE '2026-11-15',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        '99999999-9999-9999-9999-999999999992',
        '77777777-7777-7777-7777-777777777777',
        '22222222-2222-2222-2222-222222222222',
        'Grace Inspector',
        DATE '2026-06-20',
        TIME '14:30',
        'Scheduled verification after service refill.',
        'Scheduled',
        DATE '2026-12-20',
        '11111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (id) DO UPDATE SET
    extinguisher_id = EXCLUDED.extinguisher_id,
    inspector_id = EXCLUDED.inspector_id,
    inspector_name = EXCLUDED.inspector_name,
    inspection_date = EXCLUDED.inspection_date,
    inspection_time = EXCLUDED.inspection_time,
    findings = EXCLUDED.findings,
    status = EXCLUDED.status,
    next_inspection_date = EXCLUDED.next_inspection_date,
    created_by = EXCLUDED.created_by;

INSERT INTO maintenance (
    id,
    extinguisher_id,
    service_date,
    service_company,
    technician_name,
    action_taken,
    issues_identified,
    recommendations,
    next_service_date,
    cost,
    description,
    status,
    created_by
)
VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        '77777777-7777-7777-7777-777777777777',
        DATE '2026-06-01',
        'SafeSpark Services',
        'David Tech',
        'Refilled cylinder and replaced safety pin.',
        'Gauge was low before refill.',
        'Complete follow-up inspection before end of June.',
        DATE '2026-12-01',
        45.00,
        'Routine service completed after low-pressure alert.',
        'completed',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        '88888888-8888-8888-8888-888888888888',
        DATE '2026-06-05',
        'SafeSpark Services',
        'David Tech',
        'Assessment only.',
        'Unit is expired and due for replacement.',
        'Decommission and replace immediately.',
        DATE '2026-06-12',
        0.00,
        'Assessment generated for expired extinguisher.',
        'scheduled',
        '11111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (id) DO UPDATE SET
    extinguisher_id = EXCLUDED.extinguisher_id,
    service_date = EXCLUDED.service_date,
    service_company = EXCLUDED.service_company,
    technician_name = EXCLUDED.technician_name,
    action_taken = EXCLUDED.action_taken,
    issues_identified = EXCLUDED.issues_identified,
    recommendations = EXCLUDED.recommendations,
    next_service_date = EXCLUDED.next_service_date,
    cost = EXCLUDED.cost,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    created_by = EXCLUDED.created_by;

INSERT INTO notifications (
    id,
    customer_id,
    extinguisher_id,
    user_id,
    type,
    title,
    message,
    is_read,
    email_sent,
    email_sent_at,
    days_until_expiry,
    escalation_stage,
    recipient_email
)
VALUES
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
        '55555555-5555-5555-5555-555555555555',
        '88888888-8888-8888-8888-888888888888',
        '11111111-1111-1111-1111-111111111111',
        'compliance_violation',
        'Expired extinguisher requires replacement',
        'EXT-100003 is expired and should be replaced before the next audit cycle.',
        false,
        false,
        NULL,
        -10,
        1,
        'admin@femcs.rw'
    )
ON CONFLICT (id) DO UPDATE SET
    customer_id = EXCLUDED.customer_id,
    extinguisher_id = EXCLUDED.extinguisher_id,
    user_id = EXCLUDED.user_id,
    type = EXCLUDED.type,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    is_read = EXCLUDED.is_read,
    email_sent = EXCLUDED.email_sent,
    email_sent_at = EXCLUDED.email_sent_at,
    days_until_expiry = EXCLUDED.days_until_expiry,
    escalation_stage = EXCLUDED.escalation_stage,
    recipient_email = EXCLUDED.recipient_email;

INSERT INTO escalations (
    id,
    extinguisher_id,
    customer_id,
    stage,
    reason,
    status,
    notes
)
VALUES
    (
        'cccccccc-cccc-cccc-cccc-ccccccccccc1',
        '88888888-8888-8888-8888-888888888888',
        '55555555-5555-5555-5555-555555555555',
        1,
        'Expired extinguisher detected during compliance review.',
        'open',
        'Open starter escalation for dashboard and notification testing.'
    )
ON CONFLICT (id) DO UPDATE SET
    extinguisher_id = EXCLUDED.extinguisher_id,
    customer_id = EXCLUDED.customer_id,
    stage = EXCLUDED.stage,
    reason = EXCLUDED.reason,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes;

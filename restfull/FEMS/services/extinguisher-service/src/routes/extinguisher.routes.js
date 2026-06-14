const express = require('express');
const Joi = require('joi');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail, buildRegistrationEmail } = require('../mailer');

const router = express.Router();

const TYPES = ['Water', 'CO2', 'Foam', 'Dry Chemical'];
const SIZES = ['2.5 lb', '5 lb', '9 lb', '12 lb'];
const STATUSES = ['active', 'expired', 'serviced', 'decommissioned', 'pending_inspection'];

const SERIAL_REGEX = /^[A-Za-z0-9\-_\/]{3,100}$/;
const LOCATION_REGEX = /^[\w\s\-\.,#\/()]{5,300}$/;

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function today() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function normalizeType(value) {
  if (!value) return value;
  const map = {
    water: 'Water',
    co2: 'CO2',
    foam: 'Foam',
    'dry chemical': 'Dry Chemical',
    'dry powder': 'Dry Chemical',
  };
  return map[String(value).trim().toLowerCase()] || value;
}

function validateExtinguisherDates({ manufactureDate, purchaseDate, installationDate, expiryDate, lastInspectionDate, nextInspectionDate }) {
  const errors = [];
  const mfg = manufactureDate ? parseDate(manufactureDate) : null;
  const purchase = purchaseDate ? parseDate(purchaseDate) : null;
  const install = installationDate ? parseDate(installationDate) : null;
  const expiry = parseDate(expiryDate);
  const now = today();

  if (mfg && mfg >= now) {
    errors.push('Manufacture date must be in the past');
  }

  if (purchase && purchase > now) {
    errors.push('Purchase date cannot be in the future');
  }

  if (install && install > now) {
    errors.push('Installation date cannot be in the future');
  }

  if (mfg && purchase && purchase < mfg) {
    errors.push('Purchase date cannot be before manufacture date');
  }

  if (purchase && install && install < purchase) {
    errors.push('Installation date cannot be before purchase date');
  }

  if (mfg && install && install < mfg) {
    errors.push('Installation date cannot be before manufacture date');
  }

  if (expiry && install && expiry <= install) {
    errors.push('Expiry date must be after installation date');
  }

  if (lastInspectionDate) {
    const lastInspection = parseDate(lastInspectionDate);
    if (lastInspection && lastInspection > now) {
      errors.push('Last inspection date cannot be in the future');
    }
  }

  if (nextInspectionDate) {
    const nextInspection = parseDate(nextInspectionDate);
    if (nextInspection && nextInspection <= now) {
      errors.push('Next inspection date must be a future date');
    }
    if (nextInspection && expiry && nextInspection >= expiry) {
      errors.push('Next inspection date must be before expiry date');
    }
  }

  return errors;
}

const extinguisherSchema = Joi.object({
  serialNumber: Joi.string().pattern(SERIAL_REGEX).required()
    .messages({ 'string.pattern.base': 'Serial number must be 3-100 alphanumeric characters (hyphens, underscores and slashes allowed)' }),
  type: Joi.string().required(),
  size: Joi.string().valid(...SIZES).required(),
  location: Joi.string().pattern(LOCATION_REGEX).required()
    .messages({ 'string.pattern.base': 'Location must be at least 5 characters with valid characters' }),
  installationDate: Joi.string().isoDate().required(),
  expiryDate: Joi.string().isoDate().required(),
  status: Joi.string().valid(...STATUSES).default('active'),
  customerId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'Customer ID must be a valid UUID' }),
  manufactureDate: Joi.string().isoDate().optional().allow('', null),
  purchaseDate: Joi.string().isoDate().optional().allow('', null),
  capacityLiters: Joi.number().positive().max(1000).precision(2).optional(),
  lastInspectionDate: Joi.string().isoDate().optional().allow('', null),
  nextInspectionDate: Joi.string().isoDate().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const updateSchema = Joi.object({
  serialNumber: Joi.string().pattern(SERIAL_REGEX)
    .messages({ 'string.pattern.base': 'Serial number must be 3-100 alphanumeric characters (hyphens, underscores and slashes allowed)' }),
  type: Joi.string(),
  size: Joi.string().valid(...SIZES),
  location: Joi.string().pattern(LOCATION_REGEX)
    .messages({ 'string.pattern.base': 'Location must be at least 5 characters with valid characters' }),
  installationDate: Joi.string().isoDate(),
  expiryDate: Joi.string().isoDate(),
  status: Joi.string().valid(...STATUSES),
  manufactureDate: Joi.string().isoDate().allow('', null),
  purchaseDate: Joi.string().isoDate().allow('', null),
  capacityLiters: Joi.number().positive().max(1000).precision(2),
  lastInspectionDate: Joi.string().isoDate().allow('', null),
  nextInspectionDate: Joi.string().isoDate().allow('', null),
  notes: Joi.string().max(1000).allow('', null),
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

function generateCode() {
  const rand = Math.floor(Math.random() * 900000) + 100000;
  return `EXT-${rand}`;
}

function computeComplianceStatus(expiryDate) {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysToExpiry < 0) return 'non_compliant';
  if (daysToExpiry <= 30) return 'critical';
  if (daysToExpiry <= 90) return 'warning';
  return 'compliant';
}

function formatExt(row) {
  return {
    id: row.id,
    extinguisherCode: row.extinguisher_code,
    serialNumber: row.serial_number,
    type: row.type,
    size: row.size,
    capacityLiters: row.capacity_liters !== null ? parseFloat(row.capacity_liters) : null,
    manufactureDate: row.manufacture_date,
    purchaseDate: row.purchase_date,
    installationDate: row.installation_date,
    expiryDate: row.expiry_date,
    lastInspectionDate: row.last_inspection_date,
    nextInspectionDate: row.next_inspection_date,
    location: row.location,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerOrg: row.customer_org,
    customerEmail: row.customer_email,
    status: row.status,
    complianceStatus: row.compliance_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.post('/', authenticate, async (req, res) => {
  const { error, value } = extinguisherSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  const payload = {
    ...value,
    type: normalizeType(value.type),
    manufactureDate: value.manufactureDate || value.installationDate,
    purchaseDate: value.purchaseDate || value.installationDate,
    capacityLiters: value.capacityLiters || null,
  };

  if (!TYPES.includes(payload.type)) {
    return res.status(400).json({ success: false, message: `Type must be one of: ${TYPES.join(', ')}` });
  }

  const dateErrors = validateExtinguisherDates(payload);
  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  const customerResult = await db.query(
    'SELECT id, full_name, email, organization_name FROM customers WHERE id = $1',
    [payload.customerId]
  );
  if (customerResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Customer record not found' });
  }

  const serialCheck = await db.query('SELECT id FROM extinguishers WHERE serial_number = $1', [payload.serialNumber]);
  if (serialCheck.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'An extinguisher with this serial number is already registered' });
  }

  let extCode = generateCode();
  for (let i = 0; i < 5; i += 1) {
    const check = await db.query('SELECT id FROM extinguishers WHERE extinguisher_code = $1', [extCode]);
    if (check.rows.length === 0) break;
    extCode = generateCode();
  }

  const complianceStatus = computeComplianceStatus(payload.expiryDate);

  const result = await db.query(
    `INSERT INTO extinguishers
       (extinguisher_code, serial_number, type, size, capacity_liters, manufacture_date, purchase_date,
        installation_date, expiry_date, last_inspection_date, next_inspection_date, location, customer_id,
        status, compliance_status, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [
      extCode,
      payload.serialNumber,
      payload.type,
      payload.size,
      payload.capacityLiters,
      payload.manufactureDate,
      payload.purchaseDate,
      payload.installationDate,
      payload.expiryDate,
      payload.lastInspectionDate || null,
      payload.nextInspectionDate || null,
      payload.location,
      payload.customerId,
      payload.status,
      complianceStatus,
      payload.notes || null,
      req.user.id,
    ]
  );

  const customer = customerResult.rows[0];
  const created = result.rows[0];

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_values)
     VALUES ($1,$2,'CREATE_EXTINGUISHER','extinguisher',$3,$4)`,
    [req.user.id, req.user.email, created.id, JSON.stringify(payload)]
  );

  let emailSent = false;
  let emailError = null;

  if (customer.email) {
    try {
      const daysToExpiry = Math.ceil((new Date(payload.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      await sendEmail({
        to: customer.email,
        subject: `[Fire Extinguisher System] Registered - ${extCode}`,
        html: buildRegistrationEmail({
          customerName: customer.full_name,
          extCode,
          serialNumber: payload.serialNumber,
          type: payload.type,
          size: payload.size,
          location: payload.location,
          installationDate: payload.installationDate,
          expiryDate: payload.expiryDate,
          daysToExpiry,
          complianceStatus,
        }),
      });
      emailSent = true;
    } catch (err) {
      emailError = err.message;
      console.error('Registration email failed:', err.message);
    }
  }

  res.status(201).json({
    success: true,
    message: 'Extinguisher registered successfully',
    data: formatExt({ ...created, customer_name: customer.full_name, customer_org: customer.organization_name, customer_email: customer.email }),
    notification: {
      emailSent,
      emailRecipient: customer.email || null,
      emailError,
    },
  });
});

router.get('/', authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  const search = (req.query.search || '').trim();
  const status = req.query.status || '';
  const type = normalizeType(req.query.type || '');
  const customerId = req.query.customerId || '';
  const compliance = req.query.compliance || '';

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${STATUSES.join(', ')}` });
  }
  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${TYPES.join(', ')}` });
  }

  let where = `WHERE (e.extinguisher_code ILIKE $1 OR e.serial_number ILIKE $1 OR e.location ILIKE $1 OR c.full_name ILIKE $1)`;
  const params = [`%${search}%`];

  if (status) {
    params.push(status);
    where += ` AND e.status = $${params.length}`;
  }
  if (type) {
    params.push(type);
    where += ` AND e.type = $${params.length}`;
  }
  if (customerId) {
    params.push(customerId);
    where += ` AND e.customer_id = $${params.length}`;
  }
  if (compliance) {
    params.push(compliance);
    where += ` AND e.compliance_status = $${params.length}`;
  }

  const countRes = await db.query(
    `SELECT COUNT(*) FROM extinguishers e JOIN customers c ON c.id = e.customer_id ${where}`,
    params
  );
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `SELECT e.*, c.full_name AS customer_name, c.organization_name AS customer_org, c.email AS customer_email
     FROM extinguishers e
     JOIN customers c ON c.id = e.customer_id
     ${where}
     ORDER BY e.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    success: true,
    data: result.rows.map(formatExt),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/stats', authenticate, async (req, res) => {
  const [stats, byType, byCustomer] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'expired' OR expiry_date < NOW()) AS expired,
        COUNT(*) FILTER (WHERE status = 'serviced') AS serviced,
        COUNT(*) FILTER (WHERE status = 'pending_inspection') AS pending_inspection,
        COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') AS non_compliant,
        COUNT(*) FILTER (WHERE compliance_status = 'critical') AS critical,
        COUNT(*) FILTER (WHERE compliance_status = 'warning') AS warning,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS expiring_30d,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') AS expiring_90d
      FROM extinguishers
    `),
    db.query(`SELECT type, COUNT(*) AS count FROM extinguishers GROUP BY type ORDER BY count DESC`),
    db.query(`
      SELECT c.full_name, c.organization_name, COUNT(e.id) AS count
      FROM customers c
      LEFT JOIN extinguishers e ON e.customer_id = c.id
      GROUP BY c.id, c.full_name, c.organization_name
      ORDER BY count DESC LIMIT 10
    `),
  ]);

  res.json({
    success: true,
    data: { summary: stats.rows[0], byType: byType.rows, topCustomers: byCustomer.rows },
  });
});

router.get('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid extinguisher ID format' });
  }

  const result = await db.query(
    `SELECT e.*, c.full_name AS customer_name, c.organization_name AS customer_org, c.email AS customer_email
     FROM extinguishers e
     JOIN customers c ON c.id = e.customer_id
     WHERE e.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  res.json({ success: true, data: formatExt(result.rows[0]) });
});

router.put('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid extinguisher ID format' });
  }

  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  const existing = await db.query('SELECT * FROM extinguishers WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  const current = existing.rows[0];
  const payload = {
    ...value,
    type: value.type ? normalizeType(value.type) : current.type,
    manufactureDate: value.manufactureDate !== undefined ? value.manufactureDate : current.manufacture_date,
    purchaseDate: value.purchaseDate !== undefined ? value.purchaseDate : current.purchase_date,
    installationDate: value.installationDate !== undefined ? value.installationDate : current.installation_date,
    expiryDate: value.expiryDate !== undefined ? value.expiryDate : current.expiry_date,
    lastInspectionDate: value.lastInspectionDate !== undefined ? value.lastInspectionDate : current.last_inspection_date,
    nextInspectionDate: value.nextInspectionDate !== undefined ? value.nextInspectionDate : current.next_inspection_date,
  };

  if (!TYPES.includes(payload.type)) {
    return res.status(400).json({ success: false, message: `Type must be one of: ${TYPES.join(', ')}` });
  }

  const dateErrors = validateExtinguisherDates(payload);
  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  if (value.serialNumber && value.serialNumber !== current.serial_number) {
    const serialCheck = await db.query(
      'SELECT id FROM extinguishers WHERE serial_number = $1 AND id != $2',
      [value.serialNumber, req.params.id]
    );
    if (serialCheck.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Serial number already in use by another extinguisher' });
    }
  }

  const complianceStatus = computeComplianceStatus(payload.expiryDate);

  const result = await db.query(
    `UPDATE extinguishers SET
       serial_number = COALESCE($1, serial_number),
       type = COALESCE($2, type),
       size = COALESCE($3, size),
       capacity_liters = COALESCE($4, capacity_liters),
       manufacture_date = COALESCE($5, manufacture_date),
       purchase_date = COALESCE($6, purchase_date),
       installation_date = COALESCE($7, installation_date),
       expiry_date = COALESCE($8, expiry_date),
       last_inspection_date = COALESCE($9, last_inspection_date),
       next_inspection_date = COALESCE($10, next_inspection_date),
       location = COALESCE($11, location),
       status = COALESCE($12, status),
       compliance_status = $13,
       notes = COALESCE($14, notes)
     WHERE id = $15 RETURNING *`,
    [
      value.serialNumber,
      value.type ? normalizeType(value.type) : undefined,
      value.size,
      value.capacityLiters,
      value.manufactureDate,
      value.purchaseDate,
      value.installationDate,
      value.expiryDate,
      value.lastInspectionDate,
      value.nextInspectionDate,
      value.location,
      value.status,
      complianceStatus,
      value.notes,
      req.params.id,
    ]
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values)
     VALUES ($1,$2,'UPDATE_EXTINGUISHER','extinguisher',$3,$4,$5)`,
    [req.user.id, req.user.email, req.params.id, JSON.stringify(current), JSON.stringify(value)]
  );

  res.json({ success: true, message: 'Extinguisher updated successfully', data: formatExt(result.rows[0]) });
});

router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid extinguisher ID format' });
  }

  const existing = await db.query('SELECT * FROM extinguishers WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  await db.query('DELETE FROM extinguishers WHERE id = $1', [req.params.id]);

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values)
     VALUES ($1,$2,'DELETE_EXTINGUISHER','extinguisher',$3,$4)`,
    [req.user.id, req.user.email, req.params.id, JSON.stringify(existing.rows[0])]
  );

  res.json({ success: true, message: 'Extinguisher removed successfully' });
});

module.exports = router;

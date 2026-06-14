const express = require('express');
const Joi = require('joi');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const COMPANY_REGEX = /^[A-Za-z0-9À-ÖØ-öø-ÿ\s'\-.,&()]{2,200}$/;
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'\-.]{2,200}$/;

function today() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMaintenance(row) {
  return {
    id: row.id,
    extinguisherId: row.extinguisher_id,
    extinguisherCode: row.extinguisher_code,
    serviceDate: row.service_date,
    serviceCompany: row.service_company,
    technicianName: row.technician_name,
    actionTaken: row.action_taken,
    issuesIdentified: row.issues_identified,
    recommendations: row.recommendations,
    nextServiceDate: row.next_service_date,
    cost: parseFloat(row.cost),
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  };
}

const maintenanceSchema = Joi.object({
  extinguisherId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'Extinguisher ID must be a valid UUID' }),
  serviceDate: Joi.string().isoDate().required(),
  serviceCompany: Joi.string().pattern(COMPANY_REGEX).required()
    .messages({ 'string.pattern.base': 'Service company name contains invalid characters' }),
  technicianName: Joi.string().pattern(NAME_REGEX).required()
    .messages({ 'string.pattern.base': 'Technician name must contain only letters, spaces, hyphens or apostrophes' }),
  actionTaken: Joi.string().min(3).max(255).required(),
  issuesIdentified: Joi.string().min(3).max(2000).required(),
  recommendations: Joi.string().min(3).max(2000).optional().allow('', null),
  nextServiceDate: Joi.string().isoDate().optional().allow('', null),
  cost: Joi.number().min(0).max(100000000).precision(2).default(0),
  description: Joi.string().min(5).max(2000).optional().allow('', null),
  status: Joi.string().valid(...STATUSES).default('completed'),
});

router.post('/', authenticate, async (req, res) => {
  const { error, value } = maintenanceSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    extinguisherId,
    serviceDate,
    serviceCompany,
    technicianName,
    actionTaken,
    issuesIdentified,
    recommendations,
    nextServiceDate,
    cost,
    description,
    status,
  } = value;

  const now = today();
  const serviceDay = parseDate(serviceDate);
  const dateErrors = [];

  if (['completed', 'in_progress'].includes(status) && serviceDay && serviceDay > now) {
    dateErrors.push('Service date cannot be in the future for completed or in-progress records');
  }
  if (status === 'scheduled' && serviceDay && serviceDay < now) {
    dateErrors.push('Scheduled service date must be today or in the future');
  }
  if (nextServiceDate) {
    const nextDate = parseDate(nextServiceDate);
    if (nextDate && serviceDay && nextDate <= serviceDay) {
      dateErrors.push('Next service date must be after the service date');
    }
  }
  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  const extCheck = await db.query('SELECT id, manufacture_date FROM extinguishers WHERE id = $1', [extinguisherId]);
  if (extCheck.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  const manufactureDate = parseDate(extCheck.rows[0].manufacture_date);
  if (manufactureDate && serviceDay && serviceDay < manufactureDate) {
    return res.status(400).json({
      success: false,
      message: 'Service date cannot be before the extinguisher manufacture date',
    });
  }

  const result = await db.query(
    `INSERT INTO maintenance
       (extinguisher_id, service_date, service_company, technician_name, action_taken, issues_identified, recommendations, next_service_date, cost, description, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      extinguisherId,
      serviceDate,
      serviceCompany,
      technicianName,
      actionTaken,
      issuesIdentified,
      recommendations || null,
      nextServiceDate || null,
      cost,
      description || null,
      status,
      req.user.id,
    ]
  );

  if (status === 'completed') {
    await db.query(`UPDATE extinguishers SET status = 'serviced' WHERE id = $1`, [extinguisherId]);
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_values)
     VALUES ($1,$2,'CREATE_MAINTENANCE','maintenance',$3,$4)`,
    [req.user.id, req.user.email, result.rows[0].id, JSON.stringify(value)]
  );

  res.status(201).json({
    success: true,
    message: 'Maintenance record created',
    data: formatMaintenance(result.rows[0]),
  });
});

router.get('/', authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  const extinguisherId = req.query.extinguisherId || '';
  const status = req.query.status || '';

  if (status && !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${STATUSES.join(', ')}` });
  }

  let where = 'WHERE 1=1';
  const params = [];

  if (extinguisherId) {
    if (!/^[0-9a-f-]{36}$/i.test(extinguisherId)) {
      return res.status(400).json({ success: false, message: 'Invalid extinguisher ID format' });
    }
    params.push(extinguisherId);
    where += ` AND m.extinguisher_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND m.status = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*) FROM maintenance m ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `SELECT m.*, e.extinguisher_code
     FROM maintenance m
     JOIN extinguishers e ON e.id = m.extinguisher_id
     ${where}
     ORDER BY m.service_date DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    success: true,
    data: result.rows.map(formatMaintenance),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid maintenance ID format' });
  }

  const result = await db.query(
    `SELECT m.*, e.extinguisher_code
     FROM maintenance m
     JOIN extinguishers e ON e.id = m.extinguisher_id
     WHERE m.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  res.json({ success: true, data: formatMaintenance(result.rows[0]) });
});

router.put('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid maintenance ID format' });
  }

  const existing = await db.query('SELECT * FROM maintenance WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  const { error, value } = maintenanceSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    extinguisherId,
    serviceDate,
    serviceCompany,
    technicianName,
    actionTaken,
    issuesIdentified,
    recommendations,
    nextServiceDate,
    cost,
    description,
    status,
  } = value;

  const now = today();
  const serviceDay = parseDate(serviceDate);
  const dateErrors = [];

  if (['completed', 'in_progress'].includes(status) && serviceDay && serviceDay > now) {
    dateErrors.push('Service date cannot be in the future for completed or in-progress records');
  }
  if (status === 'scheduled' && serviceDay && serviceDay < now) {
    dateErrors.push('Scheduled service date must be today or in the future');
  }
  if (nextServiceDate) {
    const nextDate = parseDate(nextServiceDate);
    if (nextDate && serviceDay && nextDate <= serviceDay) {
      dateErrors.push('Next service date must be after the service date');
    }
  }
  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  const extCheck = await db.query('SELECT id, manufacture_date FROM extinguishers WHERE id = $1', [extinguisherId]);
  if (extCheck.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  const manufactureDate = parseDate(extCheck.rows[0].manufacture_date);
  if (manufactureDate && serviceDay && serviceDay < manufactureDate) {
    return res.status(400).json({
      success: false,
      message: 'Service date cannot be before the extinguisher manufacture date',
    });
  }

  const result = await db.query(
    `UPDATE maintenance SET
       extinguisher_id = $1,
       service_date = $2,
       service_company = $3,
       technician_name = $4,
       action_taken = $5,
       issues_identified = $6,
       recommendations = $7,
       next_service_date = $8,
       cost = $9,
       description = $10,
       status = $11
     WHERE id = $12
     RETURNING *`,
    [
      extinguisherId,
      serviceDate,
      serviceCompany,
      technicianName,
      actionTaken,
      issuesIdentified,
      recommendations || null,
      nextServiceDate || null,
      cost,
      description || null,
      status,
      req.params.id,
    ]
  );

  if (status === 'completed') {
    await db.query(`UPDATE extinguishers SET status = 'serviced' WHERE id = $1`, [extinguisherId]);
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values)
     VALUES ($1,$2,'UPDATE_MAINTENANCE','maintenance',$3,$4,$5)`,
    [req.user.id, req.user.email, req.params.id, JSON.stringify(existing.rows[0]), JSON.stringify(value)]
  );

  res.json({
    success: true,
    message: 'Maintenance record updated',
    data: formatMaintenance(result.rows[0]),
  });
});

router.patch('/:id/status', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid maintenance ID format' });
  }

  const { status } = req.body;
  if (!status || !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(', ')}` });
  }

  const existing = await db.query('SELECT * FROM maintenance WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Maintenance record not found' });
  }

  if (existing.rows[0].status === 'cancelled' && status !== 'cancelled') {
    return res.status(400).json({ success: false, message: 'Cannot change status of a cancelled maintenance record' });
  }

  const result = await db.query(
    `UPDATE maintenance SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );

  if (status === 'completed') {
    await db.query(`UPDATE extinguishers SET status = 'serviced' WHERE id = $1`, [result.rows[0].extinguisher_id]);
  }

  res.json({ success: true, message: 'Status updated', data: formatMaintenance(result.rows[0]) });
});

module.exports = router;

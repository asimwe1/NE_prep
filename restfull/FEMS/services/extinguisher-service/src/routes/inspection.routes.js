const express = require('express');
const Joi = require('joi');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { sendEmail, buildInspectionScheduleEmail } = require('../mailer');

const router = express.Router();

const VALID_STATUSES = ['Scheduled', 'Completed', 'Requires Service', 'Failed'];

function today() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function parseDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatInspection(row) {
  return {
    id: row.id,
    extinguisherId: row.extinguisher_id,
    extinguisherCode: row.extinguisher_code,
    inspectorId: row.inspector_id,
    inspectorName: row.inspector_name,
    inspectionDate: row.inspection_date,
    inspectionTime: row.inspection_time,
    findings: row.findings,
    status: row.status,
    nextInspectionDate: row.next_inspection_date,
    createdAt: row.created_at,
  };
}

const inspectionSchema = Joi.object({
  extinguisherId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'Extinguisher ID must be a valid UUID' }),
  inspectorId: Joi.string().uuid().required()
    .messages({ 'string.guid': 'Inspector ID must be a valid UUID' }),
  inspectionDate: Joi.string().isoDate().required(),
  inspectionTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().allow('', null)
    .messages({ 'string.pattern.base': 'Inspection time must be in HH:mm format' }),
  findings: Joi.string().min(5).max(2000).optional().allow('', null)
    .messages({ 'string.min': 'Findings must be at least 5 characters if provided' }),
  status: Joi.string().valid(...VALID_STATUSES).required(),
  nextInspectionDate: Joi.string().isoDate().optional().allow('', null),
});

async function notifyScheduledInspection({ extinguisherId, extinguisherCode, location, inspectionDate, inspectionTime, inspectorId, inspectorName, schedulerName }) {
  const recipients = await db.query(
    `SELECT DISTINCT id, first_name, last_name, email, role
     FROM users
     WHERE is_active = true
       AND (id = $1 OR role = 'admin')`,
    [inspectorId]
  );

  const title = `Inspection Scheduled: ${extinguisherCode}`;
  const message = `Inspection for extinguisher ${extinguisherCode} has been scheduled on ${new Date(inspectionDate).toLocaleDateString()}${inspectionTime ? ` at ${inspectionTime}` : ''}. Assigned inspector: ${inspectorName}.`;

  for (const recipient of recipients.rows) {
    const notifResult = await db.query(
      `INSERT INTO notifications
         (extinguisher_id, user_id, type, title, message, recipient_email)
       VALUES ($1,$2,'inspection_due',$3,$4,$5)
       RETURNING id`,
      [extinguisherId, recipient.id, title, message, recipient.email || null]
    );

    if (!recipient.email) {
      continue;
    }

    try {
      const html = buildInspectionScheduleEmail({
        recipientName: `${recipient.first_name} ${recipient.last_name}`.trim(),
        schedulerName,
        inspectorName,
        extCode: extinguisherCode,
        location,
        inspectionDate,
        inspectionTime,
      });

      await sendEmail({
        to: recipient.email,
        subject: `[Fire Extinguisher System] ${title}`,
        html,
      });

      await db.query(
        `UPDATE notifications SET email_sent = true, email_sent_at = NOW() WHERE id = $1`,
        [notifResult.rows[0].id]
      );
    } catch (err) {
      console.error('Inspection schedule email failed:', err.message);
    }
  }
}

router.post('/', authenticate, async (req, res) => {
  const { error, value } = inspectionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  const { extinguisherId, inspectorId, inspectionDate, inspectionTime, findings, status, nextInspectionDate } = value;
  const now = today();
  const inspectionDay = parseDate(inspectionDate);
  const dateErrors = [];

  if (req.user.role === 'user') {
    if (status !== 'Scheduled') {
      return res.status(403).json({
        success: false,
        message: 'Users can only schedule inspections. Inspection outcomes must be recorded by an inspector or admin.',
      });
    }

    if (findings || nextInspectionDate) {
      return res.status(403).json({
        success: false,
        message: 'Users can schedule inspection date, time, extinguisher, and assigned inspector only.',
      });
    }
  }

  if (status === 'Scheduled' && !inspectionTime) {
    dateErrors.push('Scheduled inspections require an inspection time');
  }

  if (status === 'Scheduled' && inspectionDay && inspectionDay < now) {
    dateErrors.push('Scheduled inspection date must be today or in the future');
  }

  if (status !== 'Scheduled' && inspectionDay && inspectionDay > now) {
    dateErrors.push('Completed inspection date cannot be in the future');
  }

  if (nextInspectionDate) {
    const nextDate = parseDate(nextInspectionDate);
    if (nextDate && inspectionDay && nextDate <= inspectionDay) {
      dateErrors.push('Next inspection date must be after the inspection date');
    }
  }

  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  const extCheck = await db.query(
    'SELECT id, extinguisher_code, location, expiry_date, manufacture_date FROM extinguishers WHERE id = $1',
    [extinguisherId]
  );
  if (extCheck.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  const inspectorResult = await db.query(
    `SELECT id, first_name, last_name, email
     FROM users
     WHERE id = $1 AND role = 'inspector' AND is_active = true`,
    [inspectorId]
  );
  if (inspectorResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Selected inspector not found or is not active' });
  }

  const ext = extCheck.rows[0];
  const inspector = inspectorResult.rows[0];
  const inspectorName = `${inspector.first_name} ${inspector.last_name}`.trim();
  const manufactureDate = parseDate(ext.manufacture_date);

  if (manufactureDate && inspectionDay && inspectionDay < manufactureDate) {
    return res.status(400).json({
      success: false,
      message: 'Inspection date cannot be before the extinguisher manufacture date',
    });
  }

  if (nextInspectionDate && ext.expiry_date) {
    const nextDate = parseDate(nextInspectionDate);
    const expiryDate = parseDate(ext.expiry_date);
    if (nextDate && expiryDate && nextDate >= expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Next inspection date must be before the extinguisher expiry date',
      });
    }
  }

  const result = await db.query(
    `INSERT INTO inspections
       (extinguisher_id, inspector_id, inspector_name, inspection_date, inspection_time, findings, status, next_inspection_date, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     RETURNING *`,
    [
      extinguisherId,
      inspectorId,
      inspectorName,
      inspectionDate,
      inspectionTime || null,
      findings || null,
      status,
      nextInspectionDate || null,
      req.user.id,
    ]
  );

  if (status !== 'Scheduled') {
    const extinguisherStatus = status === 'Completed' ? 'active' : 'pending_inspection';
    await db.query(
      `UPDATE extinguishers SET
         last_inspection_date = $1,
         next_inspection_date = COALESCE($2, next_inspection_date),
         status = $3
       WHERE id = $4`,
      [inspectionDate, nextInspectionDate || null, extinguisherStatus, extinguisherId]
    );
  } else if (nextInspectionDate) {
    await db.query(
      `UPDATE extinguishers SET next_inspection_date = $1, status = 'pending_inspection' WHERE id = $2`,
      [nextInspectionDate, extinguisherId]
    );
  }

  if (status === 'Scheduled') {
    const schedulerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
    await notifyScheduledInspection({
      extinguisherId,
      extinguisherCode: ext.extinguisher_code,
      location: ext.location,
      inspectionDate,
      inspectionTime: inspectionTime || null,
      inspectorId,
      inspectorName,
      schedulerName,
    });
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, new_values)
     VALUES ($1,$2,'CREATE_INSPECTION','inspection',$3,$4)`,
    [req.user.id, req.user.email, result.rows[0].id, JSON.stringify(value)]
  );

  res.status(201).json({
    success: true,
    message: status === 'Scheduled' ? 'Inspection scheduled successfully' : 'Inspection recorded successfully',
    data: formatInspection(result.rows[0]),
  });
});

router.get('/', authenticate, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10', 10)));
  const offset = (page - 1) * limit;
  const extinguisherId = req.query.extinguisherId || '';
  const status = req.query.status || '';

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  let where = 'WHERE 1=1';
  const params = [];

  if (extinguisherId) {
    if (!/^[0-9a-f-]{36}$/i.test(extinguisherId)) {
      return res.status(400).json({ success: false, message: 'Invalid extinguisher ID format' });
    }
    params.push(extinguisherId);
    where += ` AND i.extinguisher_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    where += ` AND i.status = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*) FROM inspections i ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `SELECT i.*, e.extinguisher_code
     FROM inspections i
     JOIN extinguishers e ON e.id = i.extinguisher_id
     ${where}
     ORDER BY i.inspection_date DESC, i.inspection_time DESC NULLS LAST
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    success: true,
    data: result.rows.map(formatInspection),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid inspection ID format' });
  }

  const result = await db.query(
    `SELECT i.*, e.extinguisher_code
     FROM inspections i
     JOIN extinguishers e ON e.id = i.extinguisher_id
     WHERE i.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Inspection not found' });
  }

  res.json({ success: true, data: formatInspection(result.rows[0]) });
});

router.put('/:id', authenticate, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid inspection ID format' });
  }

  const existing = await db.query('SELECT * FROM inspections WHERE id = $1', [req.params.id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Inspection not found' });
  }

  const { error, value } = inspectionSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }

  const { extinguisherId, inspectorId, inspectionDate, inspectionTime, findings, status, nextInspectionDate } = value;
  const now = today();
  const inspectionDay = parseDate(inspectionDate);
  const dateErrors = [];

  if (req.user.role === 'user') {
    if (status !== 'Scheduled') {
      return res.status(403).json({
        success: false,
        message: 'Users can only schedule inspections. Inspection outcomes must be recorded by an inspector or admin.',
      });
    }

    if (findings || nextInspectionDate) {
      return res.status(403).json({
        success: false,
        message: 'Users can schedule inspection date, time, extinguisher, and assigned inspector only.',
      });
    }
  }

  if (status === 'Scheduled' && !inspectionTime) {
    dateErrors.push('Scheduled inspections require an inspection time');
  }

  if (status === 'Scheduled' && inspectionDay && inspectionDay < now) {
    dateErrors.push('Scheduled inspection date must be today or in the future');
  }

  if (status !== 'Scheduled' && inspectionDay && inspectionDay > now) {
    dateErrors.push('Completed inspection date cannot be in the future');
  }

  if (nextInspectionDate) {
    const nextDate = parseDate(nextInspectionDate);
    if (nextDate && inspectionDay && nextDate <= inspectionDay) {
      dateErrors.push('Next inspection date must be after the inspection date');
    }
  }

  if (dateErrors.length > 0) {
    return res.status(400).json({ success: false, message: 'Date validation failed', errors: dateErrors });
  }

  const extCheck = await db.query(
    'SELECT id, extinguisher_code, location, expiry_date, manufacture_date FROM extinguishers WHERE id = $1',
    [extinguisherId]
  );
  if (extCheck.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Extinguisher not found' });
  }

  const inspectorResult = await db.query(
    `SELECT id, first_name, last_name, email
     FROM users
     WHERE id = $1 AND role = 'inspector' AND is_active = true`,
    [inspectorId]
  );
  if (inspectorResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Selected inspector not found or is not active' });
  }

  const ext = extCheck.rows[0];
  const inspector = inspectorResult.rows[0];
  const inspectorName = `${inspector.first_name} ${inspector.last_name}`.trim();
  const manufactureDate = parseDate(ext.manufacture_date);

  if (manufactureDate && inspectionDay && inspectionDay < manufactureDate) {
    return res.status(400).json({
      success: false,
      message: 'Inspection date cannot be before the extinguisher manufacture date',
    });
  }

  if (nextInspectionDate && ext.expiry_date) {
    const nextDate = parseDate(nextInspectionDate);
    const expiryDate = parseDate(ext.expiry_date);
    if (nextDate && expiryDate && nextDate >= expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Next inspection date must be before the extinguisher expiry date',
      });
    }
  }

  const result = await db.query(
    `UPDATE inspections SET
       extinguisher_id = $1,
       inspector_id = $2,
       inspector_name = $3,
       inspection_date = $4,
       inspection_time = $5,
       findings = $6,
       status = $7,
       next_inspection_date = $8
     WHERE id = $9
     RETURNING *`,
    [
      extinguisherId,
      inspectorId,
      inspectorName,
      inspectionDate,
      inspectionTime || null,
      findings || null,
      status,
      nextInspectionDate || null,
      req.params.id,
    ]
  );

  if (status !== 'Scheduled') {
    const extinguisherStatus = status === 'Completed' ? 'active' : 'pending_inspection';
    await db.query(
      `UPDATE extinguishers SET
         last_inspection_date = $1,
         next_inspection_date = COALESCE($2, next_inspection_date),
         status = $3
       WHERE id = $4`,
      [inspectionDate, nextInspectionDate || null, extinguisherStatus, extinguisherId]
    );
  } else if (nextInspectionDate) {
    await db.query(
      `UPDATE extinguishers SET next_inspection_date = $1, status = 'pending_inspection' WHERE id = $2`,
      [nextInspectionDate, extinguisherId]
    );
  }

  if (status === 'Scheduled') {
    const schedulerName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email;
    await notifyScheduledInspection({
      extinguisherId,
      extinguisherCode: ext.extinguisher_code,
      location: ext.location,
      inspectionDate,
      inspectionTime: inspectionTime || null,
      inspectorId,
      inspectorName,
      schedulerName,
    });
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values)
     VALUES ($1,$2,'UPDATE_INSPECTION','inspection',$3,$4,$5)`,
    [req.user.id, req.user.email, req.params.id, JSON.stringify(existing.rows[0]), JSON.stringify(value)]
  );

  res.json({
    success: true,
    message: status === 'Scheduled' ? 'Inspection updated successfully' : 'Inspection record updated successfully',
    data: formatInspection(result.rows[0]),
  });
});

module.exports = router;

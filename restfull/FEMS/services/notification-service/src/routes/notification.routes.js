const express = require('express');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { checkExpiryAndNotify, checkEscalations } = require('../scheduler');

const router = express.Router();

function formatNotification(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    extinguisherId: row.extinguisher_id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: row.is_read,
    emailSent: row.email_sent,
    emailSentAt: row.email_sent_at,
    daysUntilExpiry: row.days_until_expiry,
    escalationStage: row.escalation_stage,
    createdAt: row.created_at,
  };
}

router.get('/', authenticate, async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const offset = (page - 1) * limit;
  const unreadOnly = req.query.unread === 'true';
  const type = req.query.type || '';

  let where = 'WHERE n.user_id = $1';
  const params = [req.user.id];

  if (unreadOnly) where += ' AND n.is_read = false';
  if (type) {
    params.push(type);
    where += ` AND n.type = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*) FROM notifications n ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  const unreadCount = await db.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
    [req.user.id]
  );

  params.push(limit, offset);
  const result = await db.query(
    `SELECT n.* FROM notifications n ${where}
     ORDER BY n.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    success: true,
    data: result.rows.map(formatNotification),
    unreadCount: parseInt(unreadCount.rows[0].count, 10),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.patch('/:id/read', authenticate, async (req, res) => {
  const result = await db.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }
  res.json({ success: true, message: 'Marked as read', data: formatNotification(result.rows[0]) });
});

router.patch('/read-all', authenticate, async (req, res) => {
  await db.query(
    `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`,
    [req.user.id]
  );
  res.json({ success: true, message: 'All notifications marked as read' });
});

router.get('/escalations', authenticate, authorize('admin', 'inspector'), async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '10', 10);
  const offset = (page - 1) * limit;
  const status = req.query.status || '';

  let where = 'WHERE 1=1';
  const params = [];
  if (status) {
    params.push(status);
    where += ` AND esc.status = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*) FROM escalations esc ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(
    `SELECT esc.*, e.extinguisher_code, e.serial_number, e.location,
            c.full_name AS customer_name, c.organization_name
     FROM escalations esc
     JOIN extinguishers e ON e.id = esc.extinguisher_id
     JOIN customers c ON c.id = esc.customer_id
     ${where}
     ORDER BY esc.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  res.json({
    success: true,
    data: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.patch('/escalations/:id/resolve', authenticate, authorize('admin', 'inspector'), async (req, res) => {
  const { notes } = req.body;
  const result = await db.query(
    `UPDATE escalations
     SET status = 'resolved', resolved_at = NOW(), resolved_by = $1, notes = COALESCE($2, notes)
     WHERE id = $3
     RETURNING *`,
    [req.user.id, notes || null, req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Escalation not found' });
  }

  res.json({ success: true, message: 'Escalation resolved', data: result.rows[0] });
});

router.post('/trigger-check', authenticate, authorize('admin'), async (req, res) => {
  res.json({ success: true, message: 'Expiry check triggered. Processing in background.' });
  setImmediate(async () => {
    try {
      await checkExpiryAndNotify();
      await checkEscalations();
    } catch (err) {
      console.error('Manual trigger error:', err.message);
    }
  });
});

module.exports = router;

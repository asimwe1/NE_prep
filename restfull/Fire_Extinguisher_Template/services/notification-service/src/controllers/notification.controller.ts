import { Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '../utils/db';
import { AuthRequest } from '../middleware/auth.middleware';

function respond(res: Response, status: number, success: boolean, message: string, data?: unknown) {
  res.status(status).json({ success, message, data });
}

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  let whereClause = 'WHERE 1=1';

  if (req.user?.role === 'customer') {
    params.push(req.user.userId);
    whereClause += ` AND n.customer_id = $${params.length}`;
  }

  if (status) {
    params.push(status);
    whereClause += ` AND n.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM notifications n ${whereClause}`, params);
  params.push(limit, offset);

  const result = await query(
    `SELECT n.*, u.name as customer_name, u.email as customer_email,
            e.expiry_date, e.quantity, e.status as extinguisher_status
     FROM notifications n
     JOIN users u ON u.id = n.customer_id
     JOIN extinguishers e ON e.id = n.extinguisher_id
     ${whereClause}
     ORDER BY n.sent_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  respond(res, 200, true, 'Notifications fetched', {
    notifications: result.rows,
    pagination: {
      page, limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  });
};

export const acknowledgeNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { id } = req.params;

  const notifResult = await query(
    'SELECT id, customer_id, status FROM notifications WHERE id=$1',
    [id]
  );
  if (!notifResult.rows.length) {
    respond(res, 404, false, 'Notification not found');
    return;
  }

  const notif = notifResult.rows[0];

  // Customers can only ack their own
  if (req.user?.role === 'customer' && notif.customer_id !== req.user.userId) {
    respond(res, 403, false, 'Not authorized');
    return;
  }

  if (notif.status === 'acknowledged') {
    respond(res, 200, true, 'Already acknowledged', notif);
    return;
  }

  const updated = await query(
    `UPDATE notifications SET status='acknowledged', acknowledged_at=NOW() WHERE id=$1 RETURNING *`,
    [id]
  );

  respond(res, 200, true, 'Notification acknowledged', updated.rows[0]);
};

export const getNotificationStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'sent') as sent,
      COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE type = 'expired') as expired_count,
      COUNT(*) FILTER (WHERE sent_at > NOW() - INTERVAL '7 days') as last_7_days
    FROM notifications
  `);

  respond(res, 200, true, 'Stats fetched', result.rows[0]);
};

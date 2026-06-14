import { Response } from 'express';
import { validationResult } from 'express-validator';
import axios from 'axios';
import { query } from '../utils/db';
import { AuthRequest } from '../middleware/auth.middleware';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3005';

function respond(res: Response, status: number, success: boolean, message: string, data?: unknown) {
  res.status(status).json({ success, message, data });
}

export const getEscalations = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  let whereClause = 'WHERE 1=1';

  if (status) {
    params.push(status);
    whereClause += ` AND esc.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM escalations esc ${whereClause}`, params);
  params.push(limit, offset);

  const result = await query(
    `SELECT esc.*, u.name as customer_name, u.email as customer_email,
            u.phone as customer_phone, u.national_id,
            e.expiry_date, e.quantity, e.serial_numbers
     FROM escalations esc
     JOIN users u ON u.id = esc.customer_id
     JOIN extinguishers e ON e.id = esc.extinguisher_id
     ${whereClause}
     ORDER BY esc.escalated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  respond(res, 200, true, 'Escalations fetched', {
    escalations: result.rows,
    pagination: {
      page, limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  });
};

export const updateEscalation = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { id } = req.params;
  const { status, notes, authority_ref } = req.body;

  const existing = await query(
    `SELECT esc.*, u.name, u.email FROM escalations esc
     JOIN users u ON u.id = esc.customer_id WHERE esc.id=$1`,
    [id]
  );
  if (!existing.rows.length) {
    respond(res, 404, false, 'Escalation not found');
    return;
  }

  const esc = existing.rows[0];

  const updated = await query(
    `UPDATE escalations
     SET status=COALESCE($1, status),
         notes=COALESCE($2, notes),
         authority_ref=COALESCE($3, authority_ref),
         resolved_at=CASE WHEN $1 IN ('resolved','closed') THEN NOW() ELSE resolved_at END,
         updated_at=NOW()
     WHERE id=$4 RETURNING *`,
    [status, notes, authority_ref, id]
  );

  // Send email when notifying authority
  if (status === 'notified_authority') {
    try {
      await axios.post(`${EMAIL_SERVICE_URL}/send-escalation`, {
        email: esc.email,
        name: esc.name,
        reason: esc.reason,
        authorityRef: authority_ref,
      });
    } catch (err) {
      console.error('Failed to send escalation email:', err);
    }

    // Audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, metadata)
       VALUES ($1, 'escalation_authority_notified', 'escalations', $2, $3)`,
      [req.user?.userId, id, JSON.stringify({ authority_ref, customer: esc.name })]
    );
  }

  respond(res, 200, true, 'Escalation updated', updated.rows[0]);
};

export const getEscalationStats = async (_req: AuthRequest, res: Response): Promise<void> => {
  const result = await query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'open') as open,
      COUNT(*) FILTER (WHERE status = 'in_review') as in_review,
      COUNT(*) FILTER (WHERE status = 'notified_authority') as notified_authority,
      COUNT(*) FILTER (WHERE status = 'resolved') as resolved
    FROM escalations
  `);
  respond(res, 200, true, 'Escalation stats', result.rows[0]);
};

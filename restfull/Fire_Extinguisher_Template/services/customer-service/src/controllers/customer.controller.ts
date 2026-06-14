import { Response } from 'express';
import { validationResult } from 'express-validator';
import { query } from '../utils/db';
import { AuthRequest } from '../middleware/auth.middleware';

function respond(res: Response, status: number, success: boolean, message: string, data?: unknown) {
  res.status(status).json({ success, message, data });
}

// ── Customer Endpoints ──────────────────────────────────────────────

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const search = req.query.search as string | undefined;
  const offset = (page - 1) * limit;

  let whereClause = "WHERE u.role = 'customer'";
  const params: unknown[] = [];

  if (search) {
    params.push(`%${search}%`);
    whereClause += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.national_id ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM users u ${whereClause}`,
    params
  );

  params.push(limit, offset);
  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.national_id, u.address, u.is_verified, u.created_at,
            COUNT(e.id) as extinguisher_count
     FROM users u
     LEFT JOIN extinguishers e ON e.customer_id = u.id
     ${whereClause}
     GROUP BY u.id
     ORDER BY u.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  respond(res, 200, true, 'Customers fetched', {
    customers: result.rows,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  });
};

export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const result = await query(
    `SELECT u.id, u.name, u.email, u.phone, u.national_id, u.address, u.is_verified, u.created_at,
            json_agg(e.*) FILTER (WHERE e.id IS NOT NULL) as extinguishers
     FROM users u
     LEFT JOIN extinguishers e ON e.customer_id = u.id
     WHERE u.id = $1 AND u.role = 'customer'
     GROUP BY u.id`,
    [id]
  );

  if (!result.rows.length) {
    respond(res, 404, false, 'Customer not found');
    return;
  }

  respond(res, 200, true, 'Customer fetched', result.rows[0]);
};

// ── Extinguisher Endpoints ──────────────────────────────────────────

export const createExtinguisher = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { customer_id, quantity, serial_numbers, purchase_date, expiry_date, notes } = req.body;

  // Verify customer exists
  const customerCheck = await query("SELECT id FROM users WHERE id=$1 AND role='customer'", [customer_id]);
  if (!customerCheck.rows.length) {
    respond(res, 404, false, 'Customer not found');
    return;
  }

  const result = await query(
    `INSERT INTO extinguishers (customer_id, quantity, serial_numbers, purchase_date, expiry_date, notes, created_by)
     VALUES ($1,$2,$3,$4::date,$5::date,$6,$7) RETURNING *`,
    [customer_id, quantity, serial_numbers || [], purchase_date || new Date().toISOString().split('T')[0], expiry_date, notes, req.user?.userId]
  );

  respond(res, 201, true, 'Extinguisher record created', result.rows[0]);
};

export const getExtinguishers = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const status = req.query.status as string | undefined;
  const offset = (page - 1) * limit;

  const params: unknown[] = [];
  let whereClause = 'WHERE 1=1';

  if (status) {
    params.push(status);
    whereClause += ` AND e.status = $${params.length}`;
  }

  // Customers see only their own
  if (req.user?.role === 'customer') {
    params.push(req.user.userId);
    whereClause += ` AND e.customer_id = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM extinguishers e ${whereClause}`, params);

  params.push(limit, offset);
  const result = await query(
    `SELECT e.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone, u.national_id
     FROM extinguishers e
     JOIN users u ON u.id = e.customer_id
     ${whereClause}
     ORDER BY e.expiry_date ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  respond(res, 200, true, 'Extinguishers fetched', {
    extinguishers: result.rows,
    pagination: {
      page, limit,
      total: parseInt(countResult.rows[0].count),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    },
  });
};

export const updateExtinguisher = async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { id } = req.params;
  const { quantity, expiry_date, status, notes, serial_numbers } = req.body;

  const existing = await query('SELECT id FROM extinguishers WHERE id=$1', [id]);
  if (!existing.rows.length) {
    respond(res, 404, false, 'Extinguisher not found');
    return;
  }

  const result = await query(
    `UPDATE extinguishers
     SET quantity=COALESCE($1, quantity),
         expiry_date=COALESCE($2::date, expiry_date),
         status=COALESCE($3, status),
         notes=COALESCE($4, notes),
         serial_numbers=COALESCE($5, serial_numbers),
         updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [quantity, expiry_date, status, notes, serial_numbers, id]
  );

  respond(res, 200, true, 'Extinguisher updated', result.rows[0]);
};

export const getExpiringExtinguishers = async (req: AuthRequest, res: Response): Promise<void> => {
  const daysAhead = parseInt(req.query.days as string || '30');

  const result = await query(
    `SELECT e.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
            (e.expiry_date - CURRENT_DATE) AS days_until_expiry
     FROM extinguishers e
     JOIN users u ON u.id = e.customer_id
     WHERE e.expiry_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
       AND e.status NOT IN ('renewed', 'escalated')
     ORDER BY e.expiry_date ASC`,
    []
  );

  respond(res, 200, true, 'Expiring extinguishers fetched', result.rows);
};

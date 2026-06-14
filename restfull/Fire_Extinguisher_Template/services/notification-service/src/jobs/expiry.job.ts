import cron from 'node-cron';
import axios from 'axios';
import { query } from '../utils/db';

const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3005';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3006';
const ESCALATION_AFTER_DAYS = parseInt(process.env.ESCALATION_AFTER_DAYS || '30');

const THRESHOLDS = [30, 14, 7, 1, 0]; // days before expiry

function getNotificationType(daysLeft: number): string {
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 1) return 'expiry_1day';
  if (daysLeft <= 7) return 'expiry_7days';
  if (daysLeft <= 14) return 'expiry_14days';
  return 'expiry_30days';
}

async function processExpiryNotifications() {
  console.log(`[${new Date().toISOString()}] Running expiry scan...`);

  for (const threshold of THRESHOLDS) {
    const result = await query(
      `SELECT e.*, u.name, u.email,
              (e.expiry_date - CURRENT_DATE) AS days_left
       FROM extinguishers e
       JOIN users u ON u.id = e.customer_id
       WHERE (e.expiry_date - CURRENT_DATE) = $1
         AND e.status NOT IN ('renewed','escalated')`,
      [threshold]
    );

    for (const row of result.rows) {
      const type = getNotificationType(row.days_left);

      // Check if notification already sent today for this type
      const existing = await query(
        `SELECT id FROM notifications
         WHERE extinguisher_id=$1 AND type=$2
           AND sent_at > NOW() - INTERVAL '23 hours'`,
        [row.id, type]
      );
      if (existing.rows.length) continue;

      // Insert notification record
      const notifResult = await query(
        `INSERT INTO notifications (extinguisher_id, customer_id, type, status)
         VALUES ($1,$2,$3,'sent') RETURNING id`,
        [row.id, row.customer_id, type]
      );

      const acknowledgeUrl = `${FRONTEND_URL}/notifications?ack=${notifResult.rows[0].id}`;

      // Send email
      try {
        await axios.post(`${EMAIL_SERVICE_URL}/send-expiry-notification`, {
          email: row.email,
          name: row.name,
          daysLeft: row.days_left,
          extinguisherDetails: {
            quantity: row.quantity,
            purchase_date: row.purchase_date,
            expiry_date: row.expiry_date,
            serial_numbers: row.serial_numbers,
          },
          acknowledgeUrl,
        });
        console.log(`  ✅ Notified ${row.email} — ${type}`);
      } catch (err) {
        await query(`UPDATE notifications SET status='failed' WHERE id=$1`, [notifResult.rows[0].id]);
        console.error(`  ❌ Failed to notify ${row.email}`, err);
      }

      // Update extinguisher status
      if (row.days_left <= 0) {
        await query(`UPDATE extinguishers SET status='expired' WHERE id=$1`, [row.id]);
      } else if (row.days_left <= 14) {
        await query(`UPDATE extinguishers SET status='expiring_soon' WHERE id=$1`, [row.id]);
      }
    }
  }

  // Check for escalation: expired + no ack within ESCALATION_AFTER_DAYS
  const toEscalate = await query(
    `SELECT DISTINCT e.id, e.customer_id, e.expiry_date,
            (CURRENT_DATE - e.expiry_date) AS days_overdue
     FROM extinguishers e
     WHERE e.status = 'expired'
       AND (CURRENT_DATE - e.expiry_date) >= $1
       AND NOT EXISTS (
         SELECT 1 FROM escalations esc WHERE esc.extinguisher_id = e.id AND esc.status != 'closed'
       )`,
    [ESCALATION_AFTER_DAYS]
  );

  for (const row of toEscalate.rows) {
    await query(
      `INSERT INTO escalations (customer_id, extinguisher_id, reason, status)
       VALUES ($1, $2, $3, 'open')`,
      [row.customer_id, row.id, `Extinguisher expired ${row.days_overdue} days ago with no renewal or response.`]
    );
    await query(`UPDATE extinguishers SET status='escalated' WHERE id=$1`, [row.id]);
    console.log(`  🚨 Escalation created for extinguisher ${row.id}`);
  }

  console.log(`[${new Date().toISOString()}] Expiry scan complete.`);
}

// Run daily at 8 AM
export function startCronJobs() {
  cron.schedule('0 8 * * *', processExpiryNotifications, { timezone: 'Africa/Kigali' });
  console.log('⏰ Cron jobs scheduled (daily 08:00 Africa/Kigali)');

  // Also run once at startup for dev convenience
  if (process.env.NODE_ENV !== 'production') {
    processExpiryNotifications().catch(console.error);
  }
}

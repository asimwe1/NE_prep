const express = require('express');
const { Parser } = require('json2csv');
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

const INSTITUTION_NAME = 'TZW LTD';
const SYSTEM_NAME = 'TZW LTD Extinguisher Reporting';

function humanizeKey(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bid\b/gi, 'ID')
    .replace(/\bapi\b/gi, 'API')
    .replace(/\bcsv\b/gi, 'CSV')
    .replace(/\bpdf\b/gi, 'PDF')
    .replace(/\bextinguisher code\b/gi, 'Extinguisher Code')
    .replace(/\bserial number\b/gi, 'Serial Number')
    .replace(/\borganization name\b/gi, 'Organization')
    .replace(/\bcustomer name\b/gi, 'Facility Contact')
    .replace(/\bnext inspection date\b/gi, 'Next Inspection Date')
    .replace(/\blast inspection date\b/gi, 'Last Inspection Date')
    .replace(/\bservice date\b/gi, 'Service Date')
    .replace(/\bservice company\b/gi, 'Service Company')
    .replace(/\btechnician name\b/gi, 'Technician Name')
    .replace(/\binspection date\b/gi, 'Inspection Date')
    .replace(/\binspection time\b/gi, 'Inspection Time')
    .replace(/\bdays overdue\b/gi, 'Days Overdue')
    .replace(/\bdays remaining\b/gi, 'Days Remaining')
    .replace(/\bdays to expiry\b/gi, 'Days To Expiry')
    .replace(/\bnon compliant\b/gi, 'Non-Compliant')
    .replace(/\bcreated at\b/gi, 'Created At')
    .replace(/\bfull name\b/gi, 'Full Name')
    .replace(/\bis active\b/gi, 'Active')
    .replace(/\bmaintenance count\b/gi, 'Maintenance Count')
    .replace(/\btotal extinguishers\b/gi, 'Total Extinguishers')
    .replace(/\bactive\b/gi, 'Active')
    .replace(/\bexpired\b/gi, 'Expired')
    .replace(/\bcompliance status\b/gi, 'Compliance Status')
    .replace(/\baction taken\b/gi, 'Action Taken')
    .replace(/\bissues identified\b/gi, 'Issues Identified')
    .replace(/\brecommendations\b/gi, 'Recommendations')
    .replace(/\bstatus\b/gi, 'Status')
    .replace(/\bphone\b/gi, 'Phone')
    .replace(/\bemail\b/gi, 'Email')
    .replace(/\btype\b/gi, 'Type')
    .replace(/\bsize\b/gi, 'Size')
    .replace(/\blocation\b/gi, 'Location')
    .replace(/\baddress\b/gi, 'Address')
    .replace(/\bdescription\b/gi, 'Description')
    .replace(/\btotal cost\b/gi, 'Total Cost')
    .replace(/\bcost\b/gi, 'Cost')
    .replace(/\bcreated by\b/gi, 'Created By')
    .replace(/\bfrom\b/gi, 'From')
    .replace(/\bto\b/gi, 'To')
    .replace(/\bwindow\b/gi, 'Window')
    .replace(/\bdate\b/gi, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return new Date(`${trimmed}T00:00:00`).toLocaleDateString('en-GB');
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleString('en-GB');
      }
    }

    if (/^\d+(\.\d+)?$/.test(trimmed) && trimmed.includes('.')) {
      return Number(trimmed).toFixed(2);
    }

    return trimmed;
  }

  return String(value);
}

function sanitizePdfText(value) {
  return String(value).replace(/[()\\]/g, '\\$&');
}

function wrapPdfLine(text, maxLength = 88) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.length ? lines : [''];
}

function buildReportMeta(req, title, totalRecords, filters = {}) {
  const generatorName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email || 'System User';
  const generatorRole = req.user.role ? humanizeKey(req.user.role) : 'User';
  const generatedAt = new Date();

  return {
    institution: INSTITUTION_NAME,
    system: SYSTEM_NAME,
    title,
    generatedBy: generatorName,
    generatedByEmail: req.user.email || '-',
    generatedByRole: generatorRole,
    generatedAt: generatedAt.toISOString(),
    generatedAtDisplay: generatedAt.toLocaleString('en-GB'),
    totalRecords,
    filters,
  };
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[humanizeKey(key)] = formatValue(value);
    });
    return normalized;
  });
}

function summarizeFilters(filters) {
  const entries = Object.entries(filters || {}).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) {
    return 'No filters applied';
  }

  return entries.map(([key, value]) => `${humanizeKey(key)}: ${formatValue(value)}`).join(' | ');
}

function rowsToPdfBuffer(meta, rows) {
  const rawLines = [
    meta.institution,
    meta.system,
    meta.title,
    '',
    `Generated By: ${meta.generatedBy}`,
    `Generated By Email: ${meta.generatedByEmail}`,
    `Generated By Role: ${meta.generatedByRole}`,
    `Generated At: ${meta.generatedAtDisplay}`,
    `Total Records: ${meta.totalRecords}`,
    `Filters: ${summarizeFilters(meta.filters)}`,
    '',
  ];

  rows.forEach((row, index) => {
    rawLines.push(`Record ${index + 1}`);
    Object.entries(row).forEach(([key, value]) => {
      rawLines.push(`${key}: ${value}`);
    });
    rawLines.push('');
  });

  const lines = rawLines.flatMap((line) => wrapPdfLine(line));
  const pageHeight = 792;
  const pageWidth = 612;
  const marginTop = 760;
  const marginLeft = 40;
  const lineHeight = 14;
  const linesPerPage = 48;
  const pages = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  const objects = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');

  const pageObjectNumbers = [];
  const contentObjectNumbers = [];
  const fontObjectNumber = 3;
  objects.push('PAGES_PLACEHOLDER');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  pages.forEach((pageLines) => {
    const textCommands = pageLines.map((line, index) => {
      if (index === 0) {
        return `${marginLeft} ${marginTop} Td (${sanitizePdfText(line)}) Tj`;
      }
      return `T* (${sanitizePdfText(line)}) Tj`;
    });

    const stream = ['BT', '/F1 10 Tf', `${lineHeight} TL`, ...textCommands, 'ET'].join('\n');
    const contentObjectNumber = objects.length + 1;
    contentObjectNumbers.push(contentObjectNumber);
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`);

    const pageObjectNumber = objects.length + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents ${contentObjectNumber} 0 R /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>`
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach((content, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
  });

  const xrefPosition = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';

  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function sendCsv(res, normalizedRows, filename, meta) {
  if (!normalizedRows.length) {
    return res.status(404).json({ success: false, message: 'No data found for this report' });
  }

  const parser = new Parser({ fields: Object.keys(normalizedRows[0]) });
  const csvBody = parser.parse(normalizedRows);
  const preface = [
    meta.institution,
    meta.system,
    meta.title,
    `Generated By,${meta.generatedBy}`,
    `Generated By Email,${meta.generatedByEmail}`,
    `Generated By Role,${meta.generatedByRole}`,
    `Generated At,${meta.generatedAtDisplay}`,
    `Total Records,${meta.totalRecords}`,
    `Filters,${summarizeFilters(meta.filters)}`,
    '',
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(`${preface}\n${csvBody}`);
}

function sendPdf(res, normalizedRows, filename, meta) {
  if (!normalizedRows.length) {
    return res.status(404).json({ success: false, message: 'No data found for this report' });
  }

  const pdf = rowsToPdfBuffer(meta, normalizedRows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(pdf);
}

function sendReport(res, format, rawRows, filename, meta) {
  const normalizedRows = normalizeRows(rawRows);

  if (format === 'csv') {
    return sendCsv(res, normalizedRows, `${filename}.csv`, meta);
  }
  if (format === 'pdf') {
    return sendPdf(res, normalizedRows, `${filename}.pdf`, meta);
  }

  return res.json({
    success: true,
    report: meta,
    columns: normalizedRows[0] ? Object.keys(normalizedRows[0]) : [],
    data: normalizedRows,
  });
}

router.get('/expired', authenticate, async (req, res) => {
  const format = req.query.format || 'json';
  const result = await db.query(`
    SELECT e.extinguisher_code, e.serial_number, e.type, e.size, e.location, e.expiry_date, e.status,
           e.compliance_status, c.full_name AS customer_name, c.organization_name,
           EXTRACT(DAY FROM (NOW() - e.expiry_date::timestamp))::int AS days_overdue
    FROM extinguishers e
    JOIN customers c ON c.id = e.customer_id
    WHERE e.expiry_date < NOW() OR e.status = 'expired'
    ORDER BY e.expiry_date ASC
  `);

  const meta = buildReportMeta(req, 'Expired Fire Extinguisher Report', result.rows.length);
  return sendReport(res, format, result.rows, 'tzw-ltd-expired-extinguishers-report', meta);
});

router.get('/expiring-soon', authenticate, async (req, res) => {
  const days = parseInt(req.query.days || '90', 10);
  const format = req.query.format || 'json';
  const result = await db.query(`
    SELECT e.extinguisher_code, e.serial_number, e.type, e.size, e.location, e.expiry_date, e.compliance_status,
           c.full_name AS customer_name, c.organization_name,
           EXTRACT(DAY FROM (e.expiry_date::timestamp - NOW()))::int AS days_remaining
    FROM extinguishers e
    JOIN customers c ON c.id = e.customer_id
    WHERE e.expiry_date BETWEEN NOW() AND NOW() + ($1 || ' days')::interval
      AND e.status NOT IN ('decommissioned', 'expired')
    ORDER BY e.expiry_date ASC
  `, [days]);

  const meta = buildReportMeta(req, 'Upcoming Fire Extinguisher Expiration Report', result.rows.length, { daysWindow: days });
  return sendReport(res, format, result.rows, `tzw-ltd-expiring-within-${days}-days-report`, meta);
});

router.get('/customers', authenticate, async (req, res) => {
  const format = req.query.format || 'json';
  const result = await db.query(`
    SELECT c.customer_code, c.full_name, c.phone, c.email, c.organization_name, c.address, c.is_active,
           COUNT(e.id) AS total_extinguishers,
           COUNT(e.id) FILTER (WHERE e.status = 'active') AS active,
           COUNT(e.id) FILTER (WHERE e.status = 'expired' OR e.expiry_date < NOW()) AS expired,
           COUNT(e.id) FILTER (WHERE e.compliance_status = 'non_compliant') AS non_compliant,
           c.created_at
    FROM customers c
    LEFT JOIN extinguishers e ON e.customer_id = c.id
    GROUP BY c.id
    ORDER BY c.full_name ASC
  `);

  const meta = buildReportMeta(req, 'Facility and Coverage Report', result.rows.length);
  return sendReport(res, format, result.rows, 'tzw-ltd-facility-report', meta);
});

router.get('/inspections', authenticate, async (req, res) => {
  const format = req.query.format || 'json';
  const from = req.query.from || '';
  const to = req.query.to || '';

  let where = 'WHERE 1=1';
  const params = [];
  if (from) {
    params.push(from);
    where += ` AND i.inspection_date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND i.inspection_date <= $${params.length}`;
  }

  const result = await db.query(`
    SELECT i.inspection_date, i.inspection_time, i.inspector_name, i.status, i.findings, i.next_inspection_date,
           e.extinguisher_code, e.serial_number, e.type, e.size, e.location,
           c.full_name AS customer_name, c.organization_name
    FROM inspections i
    JOIN extinguishers e ON e.id = i.extinguisher_id
    JOIN customers c ON c.id = e.customer_id
    ${where}
    ORDER BY i.inspection_date DESC, i.inspection_time DESC NULLS LAST
  `, params);

  const meta = buildReportMeta(req, 'Inspection Activity Report', result.rows.length, { from, to });
  return sendReport(res, format, result.rows, 'tzw-ltd-inspection-report', meta);
});

router.get('/inspections/status-summary', authenticate, async (req, res) => {
  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'Scheduled' AND inspection_date >= CURRENT_DATE) AS pending_inspections,
      COUNT(*) FILTER (WHERE status = 'Completed') AS completed_inspections,
      COUNT(*) FILTER (WHERE status = 'Scheduled' AND inspection_date < CURRENT_DATE) AS overdue_inspections
    FROM inspections
  `);

  res.json({ success: true, data: result.rows[0] });
});

router.get('/maintenance', authenticate, async (req, res) => {
  const format = req.query.format || 'json';
  const from = req.query.from || '';
  const to = req.query.to || '';

  let where = 'WHERE 1=1';
  const params = [];
  if (from) {
    params.push(from);
    where += ` AND m.service_date >= $${params.length}`;
  }
  if (to) {
    params.push(to);
    where += ` AND m.service_date <= $${params.length}`;
  }

  const result = await db.query(`
    SELECT m.service_date, m.service_company, m.technician_name, m.action_taken, m.issues_identified,
           m.recommendations, m.status, m.cost, m.next_service_date, m.description,
           e.extinguisher_code, e.serial_number, e.type, e.size, e.location,
           c.full_name AS customer_name, c.organization_name
    FROM maintenance m
    JOIN extinguishers e ON e.id = m.extinguisher_id
    JOIN customers c ON c.id = e.customer_id
    ${where}
    ORDER BY m.service_date DESC
  `, params);

  const meta = buildReportMeta(req, 'Maintenance Service Report', result.rows.length, { from, to });
  return sendReport(res, format, result.rows, 'tzw-ltd-maintenance-report', meta);
});

router.get('/maintenance/frequency', authenticate, async (req, res) => {
  const result = await db.query(`
    SELECT e.extinguisher_code, e.serial_number, COUNT(m.id) AS maintenance_count,
           MAX(m.service_date) AS last_maintenance_date
    FROM extinguishers e
    LEFT JOIN maintenance m ON m.extinguisher_id = e.id
    GROUP BY e.id
    ORDER BY maintenance_count DESC, last_maintenance_date DESC NULLS LAST
  `);

  res.json({ success: true, data: result.rows, total: result.rows.length });
});

router.get('/compliance', authenticate, async (req, res) => {
  const format = req.query.format || 'json';
  const result = await db.query(`
    SELECT e.extinguisher_code, e.serial_number, e.type, e.size, e.location, e.expiry_date,
           e.last_inspection_date, e.next_inspection_date, e.status, e.compliance_status,
           c.full_name AS customer_name, c.organization_name,
           EXTRACT(DAY FROM (e.expiry_date::timestamp - NOW()))::int AS days_to_expiry,
           COALESCE(MAX(esc.stage), 0) AS escalation_stage
    FROM extinguishers e
    JOIN customers c ON c.id = e.customer_id
    LEFT JOIN escalations esc ON esc.extinguisher_id = e.id AND esc.status = 'open'
    GROUP BY e.id, c.id
    ORDER BY e.compliance_status DESC, e.expiry_date ASC
  `);

  const meta = buildReportMeta(req, 'Compliance Monitoring Report', result.rows.length);
  return sendReport(res, format, result.rows, 'tzw-ltd-compliance-report', meta);
});

router.get('/inventory/summary', authenticate, async (req, res) => {
  const result = await db.query(`
    SELECT
      COUNT(*) AS total_extinguishers,
      COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS daily_inventory_summary,
      COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) AS monthly_inventory_summary,
      COUNT(*) FILTER (WHERE DATE_TRUNC('year', created_at) = DATE_TRUNC('year', CURRENT_DATE)) AS yearly_inventory_summary
    FROM extinguishers
  `);

  res.json({ success: true, data: result.rows[0] });
});

router.get('/audit', authenticate, authorize('admin'), async (req, res) => {
  const page = parseInt(req.query.page || '1', 10);
  const limit = parseInt(req.query.limit || '20', 10);
  const offset = (page - 1) * limit;
  const action = req.query.action || '';
  const entityType = req.query.entityType || '';

  let where = 'WHERE 1=1';
  const params = [];
  if (action) {
    params.push(`%${action}%`);
    where += ` AND al.action ILIKE $${params.length}`;
  }
  if (entityType) {
    params.push(entityType);
    where += ` AND al.entity_type = $${params.length}`;
  }

  const countRes = await db.query(`SELECT COUNT(*) FROM audit_logs al ${where}`, params);
  const total = parseInt(countRes.rows[0].count, 10);

  params.push(limit, offset);
  const result = await db.query(`
    SELECT al.*, u.first_name, u.last_name
    FROM audit_logs al
    LEFT JOIN users u ON u.id = al.user_id
    ${where}
    ORDER BY al.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `, params);

  res.json({
    success: true,
    data: result.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/summary', authenticate, async (req, res) => {
  const [extStats, custStats, inspectionStats, maintenanceStats] = await Promise.all([
    db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'active') AS active,
        COUNT(*) FILTER (WHERE status = 'expired' OR expiry_date < NOW()) AS expired,
        COUNT(*) FILTER (WHERE status = 'serviced') AS serviced,
        COUNT(*) FILTER (WHERE compliance_status = 'non_compliant') AS non_compliant,
        COUNT(*) FILTER (WHERE compliance_status = 'critical') AS critical,
        COUNT(*) FILTER (WHERE compliance_status = 'warning') AS warning,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '30 days') AS expiring_30d,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN NOW() AND NOW() + INTERVAL '90 days') AS expiring_90d
      FROM extinguishers
    `),
    db.query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_active) AS active FROM customers`),
    db.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'Completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'Requires Service') AS requires_service,
        COUNT(*) FILTER (WHERE status = 'Failed') AS failed,
        COUNT(*) FILTER (WHERE status = 'Scheduled' AND inspection_date >= CURRENT_DATE) AS pending,
        COUNT(*) FILTER (WHERE status = 'Scheduled' AND inspection_date < CURRENT_DATE) AS overdue
      FROM inspections
      WHERE inspection_date >= NOW() - INTERVAL '30 days'
    `),
    db.query(`
      SELECT COUNT(*) AS total, COALESCE(SUM(cost), 0) AS total_cost
      FROM maintenance
      WHERE service_date >= NOW() - INTERVAL '30 days'
    `),
  ]);

  res.json({
    success: true,
    data: {
      extinguishers: extStats.rows[0],
      customers: custStats.rows[0],
      inspections_last30d: inspectionStats.rows[0],
      maintenance_last30d: maintenanceStats.rows[0],
    },
  });
});

module.exports = router;

const nodemailer = require('nodemailer');

function getMailConfig() {
  return {
    host: process.env.MAIL_HOST || process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT || process.env.SMTP_PORT || '587', 10),
    secure: (process.env.MAIL_SECURE || process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.MAIL_USERNAME || process.env.SMTP_USER,
      pass: process.env.MAIL_PASSWORD || process.env.SMTP_PASS,
    },
  };
}

async function sendEmail({ to, subject, html }) {
  const config = getMailConfig();
  if (!config.auth.user || !config.auth.pass) {
    console.warn('[Mailer] Mail credentials not configured - skipping email send.');
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport(config);
  return transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Fire Extinguisher System <noreply@fems.local>',
    to,
    subject,
    html,
  });
}

function buildRegistrationEmail({ customerName, extCode, serialNumber, type, size, location, installationDate, expiryDate, daysToExpiry, complianceStatus }) {
  const complianceColor = { compliant: '#4ade80', warning: '#fbbf24', critical: '#fb923c', non_compliant: '#f87171' }[complianceStatus] || '#94a3b8';

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;">
    <div style="background:#22d3ee;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#0a0f1e;font-size:20px;">Fire Extinguisher Registered</h1>
    </div>
    <div style="padding:30px;">
      <p>Dear <strong>${customerName}</strong>,</p>
      <p>A fire extinguisher has been registered in the management system.</p>
      <div style="background:#1e293b;border-radius:10px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:6px 0;width:45%;">Extinguisher Code</td><td style="font-weight:bold;font-family:monospace;">${extCode}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Serial Number</td><td style="font-weight:bold;font-family:monospace;">${serialNumber}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Type</td><td style="font-weight:bold;">${type}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Size</td><td style="font-weight:bold;">${size}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Location</td><td style="font-weight:bold;">${location}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Installation Date</td><td style="font-weight:bold;">${new Date(installationDate).toLocaleDateString()}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Expiry Date</td><td style="font-weight:bold;color:${complianceColor};">${new Date(expiryDate).toLocaleDateString()}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Days Until Expiry</td><td style="font-weight:bold;color:${complianceColor};">${daysToExpiry} days</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Compliance Status</td><td><span style="background:${complianceColor}22;color:${complianceColor};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:bold;">${complianceStatus.replace('_', ' ').toUpperCase()}</span></td></tr>
        </table>
      </div>
      <p>You will receive automated alerts before expiry and when inspections are due.</p>
      <p style="color:#64748b;font-size:12px;margin-top:30px;">This is an automated message. Do not reply to this email.</p>
    </div>
  </div>`;
}

function buildInspectionScheduleEmail({ recipientName, schedulerName, inspectorName, extCode, location, inspectionDate, inspectionTime }) {
  const scheduledTime = inspectionTime || 'Time to be confirmed';

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;">
    <div style="background:#f97316;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#0a0f1e;font-size:20px;">Inspection Scheduled</h1>
    </div>
    <div style="padding:30px;">
      <p>Dear <strong>${recipientName}</strong>,</p>
      <p>An extinguisher inspection has been scheduled in the Fire Extinguisher Management System.</p>
      <div style="background:#1e293b;border-radius:10px;padding:20px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="color:#94a3b8;padding:6px 0;width:45%;">Extinguisher Code</td><td style="font-weight:bold;font-family:monospace;">${extCode}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Assigned Inspector</td><td style="font-weight:bold;">${inspectorName}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Scheduled By</td><td style="font-weight:bold;">${schedulerName}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Inspection Date</td><td style="font-weight:bold;">${new Date(inspectionDate).toLocaleDateString()}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Inspection Time</td><td style="font-weight:bold;">${scheduledTime}</td></tr>
          <tr><td style="color:#94a3b8;padding:6px 0;">Location</td><td style="font-weight:bold;">${location}</td></tr>
        </table>
      </div>
      <p>Please review and take the necessary action for this scheduled inspection.</p>
      <p style="color:#64748b;font-size:12px;margin-top:30px;">This is an automated message. Do not reply to this email.</p>
    </div>
  </div>`;
}

module.exports = { sendEmail, buildRegistrationEmail, buildInspectionScheduleEmail };

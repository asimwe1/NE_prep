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

module.exports = { sendEmail };

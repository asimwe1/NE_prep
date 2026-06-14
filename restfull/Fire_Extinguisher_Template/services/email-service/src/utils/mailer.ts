import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const COMPANY = process.env.COMPANY_NAME || 'FireShield Safety Solutions';
const FROM = process.env.SMTP_FROM || `${COMPANY} <noreply@fireshield.com>`;

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #c0392b; padding: 24px 32px; color: white; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 4px 0 0; opacity: 0.85; font-size: 13px; }
    .body { padding: 32px; color: #333; line-height: 1.6; }
    .otp-box { background: #fff3f3; border: 2px solid #c0392b; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 36px; font-weight: bold; color: #c0392b; letter-spacing: 8px; }
    .otp-expiry { font-size: 13px; color: #666; margin-top: 8px; }
    .alert-box { background: #fff8e1; border-left: 4px solid #f39c12; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .danger-box { background: #ffeaea; border-left: 4px solid #c0392b; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .btn { display: inline-block; background: #c0392b; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
    .footer { background: #f9f9f9; padding: 20px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔥 ${COMPANY}</h1>
      <p>Fire Safety Management System</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated message from ${COMPANY}. Do not reply to this email.</p>
      <p>If you have questions, contact our support team.</p>
    </div>
  </div>
</body>
</html>`;
}

export function otpTemplate(name: string, code: string, purpose: string): string {
  const purposeLabel: Record<string, string> = {
    registration: 'verify your email address',
    login: 'complete your login',
    password_reset: 'reset your password',
  };
  return baseTemplate(`
    <p>Hello <strong>${name}</strong>,</p>
    <p>Use the OTP below to <strong>${purposeLabel[purpose] || 'verify your identity'}</strong>. This code is valid for <strong>10 minutes</strong>.</p>
    <div class="otp-box">
      <div class="otp-code">${code}</div>
      <div class="otp-expiry">⏱ Expires in 10 minutes. Do not share this code with anyone.</div>
    </div>
    <p>If you did not request this, please ignore this email.</p>
  `);
}

export function expiryNotificationTemplate(
  name: string,
  daysLeft: number,
  extinguisherDetails: { quantity: number; purchase_date: string; expiry_date: string; serial_numbers?: string[] },
  acknowledgeUrl: string
): string {
  const urgency = daysLeft <= 0 ? 'danger-box' : 'alert-box';
  const urgencyMsg = daysLeft <= 0
    ? '🚨 Your fire extinguisher(s) have <strong>already expired</strong>. Immediate action is required.'
    : `⚠️ Your fire extinguisher(s) will expire in <strong>${daysLeft} day(s)</strong>.`;

  return baseTemplate(`
    <p>Hello <strong>${name}</strong>,</p>
    <div class="${urgency}">
      <p style="margin:0">${urgencyMsg}</p>
    </div>
    <p><strong>Extinguisher Details:</strong></p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:bold">Quantity</td><td style="padding:8px 12px">${extinguisherDetails.quantity} unit(s)</td></tr>
      <tr><td style="padding:8px 12px;font-weight:bold">Purchase Date</td><td style="padding:8px 12px">${extinguisherDetails.purchase_date}</td></tr>
      <tr style="background:#f5f5f5"><td style="padding:8px 12px;font-weight:bold">Expiry Date</td><td style="padding:8px 12px;color:#c0392b"><strong>${extinguisherDetails.expiry_date}</strong></td></tr>
      ${extinguisherDetails.serial_numbers?.length ? `<tr><td style="padding:8px 12px;font-weight:bold">Serial Numbers</td><td style="padding:8px 12px">${extinguisherDetails.serial_numbers.join(', ')}</td></tr>` : ''}
    </table>
    <p style="margin-top:20px">Please click below to acknowledge this notification and arrange for renewal:</p>
    <a href="${acknowledgeUrl}" class="btn">Acknowledge &amp; View Details</a>
    <p style="font-size:13px;color:#888">Failure to renew your extinguisher(s) may result in escalation to relevant authorities in accordance with fire safety regulations.</p>
  `);
}

export function escalationTemplate(name: string, reason: string, authorityRef?: string): string {
  return baseTemplate(`
    <p>Hello <strong>${name}</strong>,</p>
    <div class="danger-box">
      <p style="margin:0">🚨 <strong>Escalation Notice</strong>: Your fire extinguisher compliance case has been escalated.</p>
    </div>
    <p><strong>Reason:</strong> ${reason}</p>
    ${authorityRef ? `<p><strong>Authority Reference:</strong> ${authorityRef}</p>` : ''}
    <p>This matter has been referred to the relevant authorities as per fire safety regulations. Please contact us immediately to resolve this situation.</p>
    <p>Ignoring this notice may result in legal action.</p>
  `);
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions) {
  return transporter.sendMail({
    from: FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

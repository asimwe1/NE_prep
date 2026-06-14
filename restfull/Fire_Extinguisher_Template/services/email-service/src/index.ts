import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sendMail, otpTemplate, expiryNotificationTemplate, escalationTemplate } from './utils/mailer';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(express.json());

app.post('/send-otp', async (req, res) => {
  const { email, name, code, purpose } = req.body;
  if (!email || !name || !code || !purpose) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  try {
    const info = await sendMail({
      to: email,
      subject: purpose === 'registration' ? 'Verify your email — FireShield'
             : purpose === 'login' ? 'Your login OTP — FireShield'
             : 'Password reset OTP — FireShield',
      html: otpTemplate(name, code, purpose),
    });
    res.json({ success: true, message: 'OTP email sent', messageId: info.messageId });
  } catch (err) {
    console.error('OTP email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

app.post('/send-expiry-notification', async (req, res) => {
  const { email, name, daysLeft, extinguisherDetails, acknowledgeUrl } = req.body;
  if (!email || !name || daysLeft === undefined || !extinguisherDetails || !acknowledgeUrl) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  try {
    const subject = daysLeft <= 0
      ? '🚨 URGENT: Fire extinguisher expired — FireShield'
      : `⚠️ Fire extinguisher expiry notice (${daysLeft} days) — FireShield`;
    const info = await sendMail({
      to: email,
      subject,
      html: expiryNotificationTemplate(name, daysLeft, extinguisherDetails, acknowledgeUrl),
    });
    res.json({ success: true, message: 'Expiry notification sent', messageId: info.messageId });
  } catch (err) {
    console.error('Expiry notification error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

app.post('/send-escalation', async (req, res) => {
  const { email, name, reason, authorityRef } = req.body;
  if (!email || !name || !reason) {
    res.status(400).json({ success: false, message: 'Missing required fields' });
    return;
  }
  try {
    const info = await sendMail({
      to: email,
      subject: '🚨 Escalation Notice — FireShield Safety',
      html: escalationTemplate(name, reason, authorityRef),
    });
    res.json({ success: true, message: 'Escalation email sent', messageId: info.messageId });
  } catch (err) {
    console.error('Escalation email error:', err);
    res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ service: 'email-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`📧 Email Service running on port ${PORT}`));
export default app;

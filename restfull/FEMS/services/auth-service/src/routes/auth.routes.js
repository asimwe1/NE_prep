const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const dns = require('dns').promises;
const db = require('../db');
const { authenticate, authorize } = require('../middleware/auth');
const { sendEmail } = require('../mailer');

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.info','guerrillamail.biz',
  'guerrillamail.de','guerrillamail.net','guerrillamail.org','guerrillamailblock.com',
  'grr.la','sharklasers.com','spam4.me','yopmail.com','yopmail.fr','cool.fr.nf',
  'jetable.fr.nf','nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr',
  'courriel.fr.nf','moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf',
  'trashmail.at','trashmail.com','trashmail.io','trashmail.me','trashmail.net',
  'trashmail.org','dispostable.com','mailnull.com','spamgourmet.com',
  'getairmail.com','filzmail.com','throwam.com','tempr.email','discard.email',
  'maildrop.cc','spamhereplease.com','mailscrap.com','fakeinbox.com',
  'mailnesia.com','nowmymail.com','tempinbox.com','mailexpire.com',
  'mailfreeonline.com','mailguard.me','mailhazard.com','tempmail.com',
  'throwaway.email','getnada.com','mohmal.com','anonaddy.com','simplelogin.io',
  'spamgourmet.net','spamgourmet.org','mailboxy.fun','inboxbear.com',
]);

async function hasMxRecord(email) {
  try {
    const domain = email.split('@')[1];
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
}

const router = express.Router();

const ROLES = ['admin', 'inspector', 'user'];

const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]{2,100}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*.?&_\-#])[A-Za-z\d@$!%*?.&_\-#]{8,64}$/;

const registerSchema = Joi.object({
  firstName: Joi.string().pattern(nameRegex).min(2).max(100).required()
    .messages({ 'string.pattern.base': 'First name must contain only letters, spaces, hyphens or apostrophes' }),
  lastName: Joi.string().pattern(nameRegex).min(2).max(100).required()
    .messages({ 'string.pattern.base': 'Last name must contain only letters, spaces, hyphens or apostrophes' }),
  email: Joi.string().email({ tlds: { allow: false } }).max(255).required(),
  password: Joi.string().pattern(passwordRegex).required()
    .messages({ 'string.pattern.base': 'Password must be 8-64 chars with uppercase, lowercase, number and special character (@$!%*.?&_-#)' }),
  role: Joi.string().valid(...ROLES).default('user'),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

const forgotSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
    .messages({ 'string.pattern.base': 'OTP must be exactly 6 digits' }),
  newPassword: Joi.string().pattern(passwordRegex).required()
    .messages({ 'string.pattern.base': 'Password must be 8-64 chars with uppercase, lowercase, number and special character (@$!%*.?&_-#)' }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().pattern(passwordRegex).required()
    .messages({ 'string.pattern.base': 'Password must be 8-64 chars with uppercase, lowercase, number and special character (@$!%*.?&_-#)' }),
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().pattern(nameRegex).min(2).max(100)
    .messages({ 'string.pattern.base': 'First name must contain only letters, spaces, hyphens or apostrophes' }),
  lastName: Joi.string().pattern(nameRegex).min(2).max(100)
    .messages({ 'string.pattern.base': 'Last name must contain only letters, spaces, hyphens or apostrophes' }),
  email: Joi.string().email({ tlds: { allow: false } }).max(255),
}).min(1).messages({ 'object.min': 'At least one profile field must be provided' });

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
}

function formatUser(user) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
  };
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function buildOtpEmail(firstName, otp) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#f1f5f9;border-radius:12px;overflow:hidden;">
    <div style="background:#22d3ee;padding:20px;text-align:center;">
      <h1 style="margin:0;color:#0a0f1e;font-size:20px;">Fire Extinguisher System - Password Reset</h1>
    </div>
    <div style="padding:30px;">
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>You requested a password reset. Use the OTP below. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#1e293b;border-radius:10px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#22d3ee;">${otp}</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;">If you did not request this, ignore this email. Your password will not change.</p>
    </div>
  </div>`;
}

router.post('/register', async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  const { firstName, lastName, email, password, role } = value;

  const emailDomain = email.split('@')[1]?.toLowerCase();
  if (DISPOSABLE_DOMAINS.has(emailDomain)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: ['Temporary or disposable email addresses are not allowed. Please use a real email address.'],
    });
  }

  const validDomain = await hasMxRecord(email);
  if (!validDomain) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: ['Email domain does not exist or cannot receive mail. Please use a real email address.'],
    });
  }

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const result = await db.query(
    `INSERT INTO users (first_name, last_name, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, first_name, last_name, email, role, is_active, created_at`,
    [firstName, lastName, email.toLowerCase(), hashedPassword, role]
  );

  const user = result.rows[0];
  const token = signToken(user);

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id)
     VALUES ($1,$2,'REGISTER','user',$1)`,
    [user.id, user.email]
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user: formatUser(user), token },
  });
});

router.post('/login', async (req, res) => {
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  const { email, password } = value;
  const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

  if (result.rows.length === 0) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const user = result.rows[0];
  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Account is deactivated. Contact an administrator.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, ip_address)
     VALUES ($1,$2,'LOGIN','user',$3)`,
    [user.id, user.email, req.ip]
  );

  const token = signToken(user);
  res.json({
    success: true,
    message: 'Login successful',
    data: { user: formatUser(user), token },
  });
});

router.post('/logout', authenticate, async (req, res) => {
  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, ip_address)
     VALUES ($1,$2,'LOGOUT','user',$3)`,
    [req.user.id, req.user.email, req.ip]
  );

  res.json({ success: true, message: 'Logout successful' });
});

router.get('/validate', authenticate, async (req, res) => {
  res.json({ success: true, message: 'Token is valid', data: { user: req.user } });
});

router.get('/me', authenticate, async (req, res) => {
  const result = await db.query(
    'SELECT id, first_name, last_name, email, role, is_active, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: formatUser(result.rows[0]) });
});

router.patch('/profile', authenticate, async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  if (value.email) {
    const existingEmail = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [value.email.toLowerCase(), req.user.id]
    );
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }
  }

  const currentUser = await db.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (currentUser.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const result = await db.query(
    `UPDATE users SET
       first_name = COALESCE($1, first_name),
       last_name = COALESCE($2, last_name),
       email = COALESCE($3, email)
     WHERE id = $4
     RETURNING id, first_name, last_name, email, role, is_active, created_at`,
    [
      value.firstName,
      value.lastName,
      value.email ? value.email.toLowerCase() : undefined,
      req.user.id,
    ]
  );

  const updatedUser = result.rows[0];

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, old_values, new_values, ip_address)
     VALUES ($1,$2,'UPDATE_PROFILE','user',$1,$3,$4,$5)`,
    [req.user.id, req.user.email, JSON.stringify(currentUser.rows[0]), JSON.stringify(value), req.ip]
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: formatUser(updatedUser), token: signToken(updatedUser) },
  });
});

router.post('/forgot-password', async (req, res) => {
  const { error, value } = forgotSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: 'Valid email is required' });
  }

  const { email } = value;
  const result = await db.query(
    'SELECT id, first_name, is_active FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0 || !result.rows[0].is_active) {
    return res.json({ success: true, message: 'If that email exists, an OTP has been sent.' });
  }

  const user = result.rows[0];
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await db.query(
    `UPDATE otps SET is_used = true WHERE email = $1 AND purpose = 'password_reset' AND is_used = false`,
    [email.toLowerCase()]
  );

  await db.query(
    `INSERT INTO otps (user_id, email, code, purpose, expires_at)
     VALUES ($1, $2, $3, 'password_reset', $4)`,
    [user.id, email.toLowerCase(), otp, expiresAt]
  );

  let emailSent = false;
  try {
    await sendEmail({
      to: email,
      subject: '[Fire Extinguisher System] Your Password Reset OTP',
      html: buildOtpEmail(user.first_name, otp),
    });
    emailSent = true;
  } catch (err) {
    console.error('OTP email failed:', err.message);
  }

  const devData = process.env.NODE_ENV === 'development' ? { otp } : {};

  res.json({
    success: true,
    message: 'If that email exists, an OTP has been sent.',
    emailSent,
    ...devData,
  });
});

router.post('/reset-password', async (req, res) => {
  const { error, value } = verifyOtpSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  const { email, otp, newPassword } = value;
  const otpResult = await db.query(
    `SELECT * FROM otps
     WHERE email = $1 AND code = $2 AND purpose = 'password_reset'
       AND is_used = false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [email.toLowerCase(), otp]
  );

  if (otpResult.rows.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  const otpRow = otpResult.rows[0];
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, otpRow.user_id]);
  await db.query('UPDATE otps SET is_used = true WHERE id = $1', [otpRow.id]);

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, ip_address)
     VALUES ($1,$2,'PASSWORD_RESET','user',$3)`,
    [otpRow.user_id, email.toLowerCase(), req.ip]
  );

  res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
});

router.post('/change-password', authenticate, async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: error.details.map((d) => d.message) });
  }

  const { currentPassword, newPassword } = value;
  const result = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const valid = await bcrypt.compare(currentPassword, result.rows[0].password);
  if (!valid) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({ success: false, message: 'New password must be different from current password' });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);

  await db.query(
    `INSERT INTO audit_logs (user_id, user_email, action, entity_type, ip_address)
     VALUES ($1,$2,'CHANGE_PASSWORD','user',$3)`,
    [req.user.id, req.user.email, req.ip]
  );

  res.json({ success: true, message: 'Password changed successfully' });
});

router.get('/inspectors', authenticate, async (req, res) => {
  const result = await db.query(
    `SELECT id, first_name, last_name, email, role, is_active, created_at
     FROM users
     WHERE role = 'inspector' AND is_active = true
     ORDER BY first_name ASC, last_name ASC, email ASC`
  );

  res.json({
    success: true,
    data: result.rows.map((user) => ({
      ...formatUser(user),
      fullName: `${user.first_name} ${user.last_name}`.trim(),
    })),
  });
});

router.get('/users', authenticate, authorize('admin'), async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  const countRes = await db.query(
    `SELECT COUNT(*) FROM users WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)`,
    [`%${search}%`]
  );
  const total = parseInt(countRes.rows[0].count, 10);

  const result = await db.query(
    `SELECT id, first_name, last_name, email, role, is_active, created_at
     FROM users
     WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [`%${search}%`, limit, offset]
  );

  res.json({
    success: true,
    data: result.rows.map(formatUser),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.patch('/users/:id/toggle', authenticate, authorize('admin'), async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
  }

  const result = await db.query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, first_name, last_name, email, role, is_active, created_at',
    [req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const user = result.rows[0];
  res.json({ success: true, message: `User ${user.is_active ? 'activated' : 'deactivated'}`, data: formatUser(user) });
});

router.patch('/users/:id/role', authenticate, authorize('admin'), async (req, res) => {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ success: false, message: `Role must be one of: ${ROLES.join(', ')}` });
  }

  if (req.params.id === req.user.id) {
    return res.status(400).json({ success: false, message: 'You cannot change your own role' });
  }

  const result = await db.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, first_name, last_name, email, role, is_active, created_at',
    [role, req.params.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, message: 'Role updated', data: formatUser(result.rows[0]) });
});

module.exports = router;

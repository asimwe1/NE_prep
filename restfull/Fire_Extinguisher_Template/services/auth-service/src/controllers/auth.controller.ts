import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { query } from '../utils/db';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:3005';
const OTP_EXPIRES_MINUTES = parseInt(process.env.OTP_EXPIRES_MINUTES || '10');

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function respond(res: Response, status: number, success: boolean, message: string, data?: unknown) {
  res.status(status).json({ success, message, data });
}

async function sendOtpEmail(email: string, name: string, code: string, purpose: string) {
  try {
    await axios.post(`${EMAIL_SERVICE_URL}/send-otp`, { email, name, code, purpose });
  } catch (err) {
    console.error('Email service error:', err);
  }
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { name, email, phone, national_id, address, password, role = 'customer' } = req.body;

  const existing = await query(
    'SELECT id FROM users WHERE email = $1 OR national_id = $2',
    [email, national_id]
  );
  if (existing.rows.length > 0) {
    respond(res, 409, false, 'Email or National ID already registered');
    return;
  }

  const password_hash = await bcrypt.hash(password, 12);
  const userResult = await query(
    `INSERT INTO users (name, email, phone, national_id, address, password_hash, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, email, role`,
    [name, email, phone, national_id, address, password_hash, role]
  );
  const user = userResult.rows[0];

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO otp_codes (user_id, code, purpose, expires_at) VALUES ($1,$2,'registration',$3)`,
    [user.id, code, expiresAt]
  );

  await sendOtpEmail(email, name, code, 'registration');
  respond(res, 201, true, 'Registration successful. Check your email for the OTP verification code.', { userId: user.id, email });
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email, code, purpose } = req.body;

  const userResult = await query('SELECT id, name, role FROM users WHERE email=$1', [email]);
  if (!userResult.rows.length) {
    respond(res, 404, false, 'User not found');
    return;
  }
  const user = userResult.rows[0];

  const otpResult = await query(
    `SELECT id, attempts FROM otp_codes
     WHERE user_id=$1 AND purpose=$2 AND used=false AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [user.id, purpose]
  );

  if (!otpResult.rows.length) {
    respond(res, 400, false, 'OTP expired or not found. Request a new one.');
    return;
  }

  const otp = otpResult.rows[0];

  if (otp.attempts >= 5) {
    respond(res, 429, false, 'Too many incorrect attempts. Request a new OTP.');
    return;
  }

  // Fetch the stored code to compare
  const codeCheck = await query(
    `SELECT code FROM otp_codes WHERE id=$1`,
    [otp.id]
  );

  if (codeCheck.rows[0].code !== code) {
    await query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id=$1', [otp.id]);
    respond(res, 400, false, 'Invalid OTP code');
    return;
  }

  await query('UPDATE otp_codes SET used=true WHERE id=$1', [otp.id]);

  if (purpose === 'registration') {
    await query('UPDATE users SET is_verified=true WHERE id=$1', [user.id]);
  }

  if (purpose === 'login' || purpose === 'registration') {
    const token = jwt.sign(
      { userId: user.id, email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );
    respond(res, 200, true, 'OTP verified successfully', { token, user: { id: user.id, name: user.name, email, role: user.role } });
    return;
  }

  respond(res, 200, true, 'OTP verified');
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email, password } = req.body;

  const userResult = await query(
    'SELECT id, name, email, role, password_hash, is_verified FROM users WHERE email=$1',
    [email]
  );
  if (!userResult.rows.length) {
    respond(res, 401, false, 'Invalid credentials');
    return;
  }

  const user = userResult.rows[0];

  if (!user.is_verified) {
    respond(res, 403, false, 'Account not verified. Please verify your email first.');
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    respond(res, 401, false, 'Invalid credentials');
    return;
  }

  // Send OTP for 2FA
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO otp_codes (user_id, code, purpose, expires_at) VALUES ($1,$2,'login',$3)`,
    [user.id, code, expiresAt]
  );
  await sendOtpEmail(email, user.name, code, 'login');

  respond(res, 200, true, 'Password verified. An OTP has been sent to your email.', { email, requiresOtp: true });
};

export const resendOtp = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ success: false, message: 'Validation failed', errors: errors.mapped() });
    return;
  }

  const { email, purpose } = req.body;

  const userResult = await query('SELECT id, name FROM users WHERE email=$1', [email]);
  if (!userResult.rows.length) {
    // Return success to avoid enumeration
    respond(res, 200, true, 'If the email exists, a new OTP has been sent.');
    return;
  }
  const user = userResult.rows[0];

  // Invalidate old OTPs
  await query(
    `UPDATE otp_codes SET used=true WHERE user_id=$1 AND purpose=$2 AND used=false`,
    [user.id, purpose]
  );

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  await query(
    `INSERT INTO otp_codes (user_id, code, purpose, expires_at) VALUES ($1,$2,$3,$4)`,
    [user.id, code, purpose, expiresAt]
  );
  await sendOtpEmail(email, user.name, code, purpose);

  respond(res, 200, true, 'A new OTP has been sent to your email.');
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    respond(res, 401, false, 'No token provided');
    return;
  }
  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    respond(res, 200, true, 'Token valid', payload);
  } catch {
    respond(res, 401, false, 'Invalid or expired token');
  }
};

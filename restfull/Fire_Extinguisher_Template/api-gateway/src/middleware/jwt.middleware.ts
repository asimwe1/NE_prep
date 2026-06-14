import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: { userId: string; email: string; role: string };
}

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

// Public routes that do NOT require authentication
const PUBLIC_PATHS = [
  { method: 'POST', path: '/auth/register' },
  { method: 'POST', path: '/auth/login' },
  { method: 'POST', path: '/auth/verify-otp' },
  { method: 'POST', path: '/auth/resend-otp' },
  { method: 'GET',  path: '/health' },
];

function isPublic(method: string, path: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => p.method === method && path.startsWith(p.path)
  );
}

export const jwtGuard = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (isPublic(req.method, req.path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    req.user = payload;
    // Forward user info downstream as headers
    req.headers['x-user-id']    = payload.userId;
    req.headers['x-user-email'] = payload.email;
    req.headers['x-user-role']  = payload.role;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

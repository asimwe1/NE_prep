import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import proxy from 'express-http-proxy';
import dotenv from 'dotenv';
import { jwtGuard } from './middleware/jwt.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_URL         = process.env.AUTH_SERVICE_URL         || 'http://localhost:3001';
const CUSTOMER_URL     = process.env.CUSTOMER_SERVICE_URL     || 'http://localhost:3002';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
const ESCALATION_URL   = process.env.ESCALATION_SERVICE_URL   || 'http://localhost:3004';

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3006', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// Global rate limit
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
}));

// JWT guard on all routes except public
app.use(jwtGuard);

// ── Proxy Routes ────────────────────────────────────────────────────

// Auth service: /auth/*
app.use('/auth', proxy(AUTH_URL, {
  proxyReqPathResolver: (req) => `/auth${req.url}`,
  proxyErrorHandler: (_err, res) => {
    res.status(503).json({ success: false, message: 'Auth service unavailable' });
  },
}));

// Customer service: /customers/*, /extinguishers/*
app.use('/customers', proxy(CUSTOMER_URL, {
  proxyReqPathResolver: (req) => `/api/customers${req.url}`,
  proxyErrorHandler: (_err, res) => {
    res.status(503).json({ success: false, message: 'Customer service unavailable' });
  },
}));

app.use('/extinguishers', proxy(CUSTOMER_URL, {
  proxyReqPathResolver: (req) => `/api/extinguishers${req.url}`,
  proxyErrorHandler: (_err, res) => {
    res.status(503).json({ success: false, message: 'Customer service unavailable' });
  },
}));

// Notification service: /notifications/*
app.use('/notifications', proxy(NOTIFICATION_URL, {
  proxyReqPathResolver: (req) => `/api/notifications${req.url}`,
  proxyErrorHandler: (_err, res) => {
    res.status(503).json({ success: false, message: 'Notification service unavailable' });
  },
}));

// Escalation service: /escalations/*
app.use('/escalations', proxy(ESCALATION_URL, {
  proxyReqPathResolver: (req) => `/api/escalations${req.url}`,
  proxyErrorHandler: (_err, res) => {
    res.status(503).json({ success: false, message: 'Escalation service unavailable' });
  },
}));

// ── Health ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    service: 'api-gateway',
    status: 'ok',
    upstreams: {
      auth: AUTH_URL,
      customer: CUSTOMER_URL,
      notification: NOTIFICATION_URL,
      escalation: ESCALATION_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

app.listen(PORT, () => {
  console.log(`🌐 API Gateway running on http://localhost:${PORT}`);
});

export default app;

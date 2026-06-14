require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DOCS_PATH = '/api/docs';
const FRONTEND_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const ALLOWED_ORIGINS = Array.from(new Set([
  ...FRONTEND_ORIGINS,
  `http://localhost:${PORT}`,
]));

app.use((req, res, next) => {
  const isDocsRoute = req.path === DOCS_PATH || req.path.startsWith(`${DOCS_PATH}/`);
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: isDocsRoute ? {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'https:', 'data:'],
      },
    } : undefined,
  })(req, res, next);
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));
app.use(morgan('combined'));

// Swagger docs
try {
  const swaggerPath = path.join(__dirname, '../../swagger.yaml');
  const swaggerDoc = YAML.load(swaggerPath);
  const swaggerJson = JSON.stringify(swaggerDoc, null, 2);

  app.get('/api/docs/swagger.yaml', (req, res) => {
    res.type('application/yaml');
    res.sendFile(swaggerPath);
  });

  app.get('/api/docs/swagger.json', (req, res) => {
    res.type('application/json');
    res.send(swaggerJson);
  });

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
    customCss: `
      .swagger-ui .topbar { background: #1f120f; border-bottom: 2px solid #d9472b; }
      .swagger-ui .scheme-container { background: #fff8f4; box-shadow: none; }
      .swagger-ui .info .title { color: #7b2415; }
    `,
    customSiteTitle: 'TZW LTD FEMS API Docs',
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      defaultModelsExpandDepth: 2,
    },
  }));
} catch (e) {
  console.log('Swagger YAML not found, skipping docs');
}

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const CUSTOMER_URL = process.env.CUSTOMER_SERVICE_URL || 'http://localhost:5002';
const EXTINGUISHER_URL = process.env.EXTINGUISHER_SERVICE_URL || 'http://localhost:5003';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';
const REPORT_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:5005';

function makeProxy(target, pathRewrite) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    timeout: 60000,
    proxyTimeout: 60000,
    on: {
      error: (err, req, res) => {
        console.error(`Proxy error to ${target}:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({ success: false, message: 'Service temporarily unavailable' });
        }
      },
    },
  });
}

// Auth: /api/auth/login  →  /login  (service has no prefix)
app.use('/api/auth', makeProxy(AUTH_URL, { '^/api/auth': '' }));
// Customer: /api/customers  →  /  (service mounts routes at /)
app.use('/api/customers', makeProxy(CUSTOMER_URL, { '^/api/customers': '' }));

// Extinguisher: /api/extinguishers  →  /extinguishers  (service mounts at /extinguishers)
app.use('/api/extinguishers', makeProxy(EXTINGUISHER_URL, { '^/api': '' }));
app.use('/api/inspections',   makeProxy(EXTINGUISHER_URL, { '^/api': '' }));
app.use('/api/maintenance',   makeProxy(EXTINGUISHER_URL, { '^/api': '' }));

// Notification: /api/notifications  →  /  (service mounts at /)
app.use('/api/notifications', makeProxy(NOTIFICATION_URL, { '^/api/notifications': '' }));

// Report: /api/reports  →  /  (service mounts at /)
app.use('/api/reports', makeProxy(REPORT_URL, { '^/api/reports': '' }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    services: { auth: AUTH_URL, customer: CUSTOMER_URL, extinguisher: EXTINGUISHER_URL, notification: NOTIFICATION_URL, report: REPORT_URL },
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Fire Extinguisher Management and Compliance System (FEMCS) - API Gateway',
    version: '1.0.0',
    docs: '/api/docs',
    openapiYaml: '/api/docs/swagger.yaml',
    openapiJson: '/api/docs/swagger.json',
    health: '/health',
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  return next(err);
});

app.listen(PORT, () => {
  console.log(`🚀 FEMCS API Gateway running on port ${PORT}`);
  console.log(`📚 Swagger docs: http://localhost:${PORT}/api/docs`);
});

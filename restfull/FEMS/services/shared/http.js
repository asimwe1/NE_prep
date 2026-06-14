const crypto = require('crypto');

function requireFromService(moduleName) {
  return require(require.resolve(moduleName, { paths: [process.cwd()] }));
}

const cors = requireFromService('cors');
const helmet = requireFromService('helmet');
const morgan = requireFromService('morgan');
const express = requireFromService('express');

function getAllowedOrigins() {
  const configured = (process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5000,http://localhost:5001,http://localhost:5002,http://localhost:5003,http://localhost:5004,http://localhost:5005,http://localhost:5006,http://localhost:5007')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return Array.from(new Set([
    ...configured,
    'http://localhost:3000',
    'http://localhost:5000',
  ]));
}

function createCorsOptions() {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  };
}

function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
}

function jsonSyntaxGuard(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload',
      requestId: req.requestId,
    });
  }
  return next(err);
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    requestId: req.requestId,
  });
}

function classifyError(err) {
  if (err.name === 'ValidationError' || err.isJoi) {
    return { status: 400, message: err.message };
  }

  if (err.message && err.message.startsWith('CORS blocked')) {
    return { status: 403, message: err.message };
  }

  if (err.code === '23505') {
    return { status: 409, message: 'A duplicate record already exists' };
  }

  if (err.code === '23503') {
    return { status: 409, message: 'This action violates a related record constraint' };
  }

  if (err.code === '22P02') {
    return { status: 400, message: 'Invalid identifier or parameter format' };
  }

  if (err.code === '28P01') {
    return { status: 503, message: 'Database authentication failed' };
  }

  if (err.status) {
    return { status: err.status, message: err.message || 'Request failed' };
  }

  return { status: 500, message: 'Internal server error' };
}

function errorHandler(serviceName) {
  return (err, req, res, next) => {
    const { status, message } = classifyError(err);
    console.error(`[${serviceName}]`, {
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      status,
      message: err.message,
      code: err.code,
    });

    res.status(status).json({
      success: false,
      message,
      requestId: req.requestId,
      ...(process.env.NODE_ENV === 'development' && status >= 500 ? { error: err.message } : {}),
    });
  };
}

function applyCommonMiddleware(app, serviceName) {
  morgan.token('request-id', (req) => req.requestId || '-');

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  }));
  app.use(cors(createCorsOptions()));
  app.use(morgan(':method :url :status :response-time ms req=:request-id'));
  app.use(expressJsonSafe);
  app.use(jsonSyntaxGuard);
}

function expressJsonSafe(req, res, next) {
  return express.json({ limit: '1mb' })(req, res, next);
}

module.exports = {
  applyCommonMiddleware,
  notFoundHandler,
  errorHandler,
};

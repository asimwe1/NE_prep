require('dotenv').config();
require('express-async-errors');
const express = require('express');
const authRoutes = require('./routes/auth.routes');
const { applyCommonMiddleware, errorHandler, notFoundHandler } = require('../../shared/http');

const app = express();
const PORT = process.env.PORT || 5001;

applyCommonMiddleware(app, 'auth-service');

app.use('/', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-service' });
});

app.use(notFoundHandler);
app.use(errorHandler('auth-service'));

app.listen(PORT, () => console.log(`Auth Service running on port ${PORT}`));

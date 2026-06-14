require('dotenv').config();
require('express-async-errors');
const express = require('express');
const customerRoutes = require('./routes/customer.routes');
const { applyCommonMiddleware, errorHandler, notFoundHandler } = require('../../shared/http');

const app = express();
const PORT = process.env.PORT || 5002;

applyCommonMiddleware(app, 'customer-service');

app.use('/', customerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'customer-service' });
});

app.use(notFoundHandler);
app.use(errorHandler('customer-service'));

app.listen(PORT, () => console.log(`Customer Service running on port ${PORT}`));

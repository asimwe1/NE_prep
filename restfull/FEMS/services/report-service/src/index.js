require('dotenv').config();
require('express-async-errors');
const express = require('express');
const reportRoutes = require('./routes/report.routes');
const { applyCommonMiddleware, errorHandler, notFoundHandler } = require('../../shared/http');

const app = express();
const PORT = process.env.PORT || 5005;

applyCommonMiddleware(app, 'report-service');

app.use('/', reportRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'report-service' });
});

app.use(notFoundHandler);
app.use(errorHandler('report-service'));

app.listen(PORT, () => console.log(`Report Service running on port ${PORT}`));

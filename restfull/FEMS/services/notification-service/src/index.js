require('dotenv').config();
require('express-async-errors');
const express = require('express');
const notificationRoutes = require('./routes/notification.routes');
const { startScheduler } = require('./scheduler');
const { applyCommonMiddleware, errorHandler, notFoundHandler } = require('../../shared/http');

const app = express();
const PORT = process.env.PORT || 5004;

applyCommonMiddleware(app, 'notification-service');

app.use('/', notificationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

app.use(notFoundHandler);
app.use(errorHandler('notification-service'));

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  startScheduler();
});

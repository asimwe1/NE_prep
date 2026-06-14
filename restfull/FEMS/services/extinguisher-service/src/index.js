require('dotenv').config();
require('express-async-errors');
const express = require('express');
const extinguisherRoutes = require('./routes/extinguisher.routes');
const inspectionRoutes = require('./routes/inspection.routes');
const maintenanceRoutes = require('./routes/maintenance.routes');
const { applyCommonMiddleware, errorHandler, notFoundHandler } = require('../../shared/http');

const app = express();
const PORT = process.env.PORT || 5003;

applyCommonMiddleware(app, 'extinguisher-service');

app.use('/extinguishers', extinguisherRoutes);
app.use('/inspections', inspectionRoutes);
app.use('/maintenance', maintenanceRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'extinguisher-service' });
});

app.use(notFoundHandler);
app.use(errorHandler('extinguisher-service'));

app.listen(PORT, () => console.log(`Extinguisher Service running on port ${PORT}`));

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notification.routes';
import { startCronJobs } from './jobs/expiry.job';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use('/api', notificationRoutes);

app.get('/health', (_req, res) => {
  res.json({ service: 'notification-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
  startCronJobs();
});

export default app;

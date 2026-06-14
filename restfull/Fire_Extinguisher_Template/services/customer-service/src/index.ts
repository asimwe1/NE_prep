import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customer.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use('/api', customerRoutes);

app.get('/health', (_req, res) => {
  res.json({ service: 'customer-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`👥 Customer Service running on port ${PORT}`));
export default app;

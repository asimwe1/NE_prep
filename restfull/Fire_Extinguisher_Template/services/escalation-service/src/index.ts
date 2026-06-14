import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import escalationRoutes from './routes/escalation.routes';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());
app.use('/api', escalationRoutes);

app.get('/health', (_req, res) => {
  res.json({ service: 'escalation-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`🚨 Escalation Service running on port ${PORT}`));
export default app;

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router as apiRouter } from './routes.js';
import { logger } from './logger.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRouter);

app.listen(PORT, () => {
  logger.info(`DriftGuard API running on port ${PORT}`);
});

export default app;

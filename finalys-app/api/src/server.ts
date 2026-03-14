// /api/src/server.ts
import express from 'express';
import cors from 'cors';
import pivotRoutes from './routes/pivotRoutes';
import datasetRoutes from './routes/datasetRoutes';
import simulationRoutes from './routes/simulationRoutes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Register API Routes
app.use('/api', pivotRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/simulations', simulationRoutes);

// Health check
app.get('/health', (req, res) => { res.status(200).send('OK'); });

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`SaaS API Layer listening on port ${PORT}`);
});
// /api/src/server.ts
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

// 1. Import your modular routers!
import pivotRoutes from './routes/pivotRoutes';
import { pivotController } from './controllers/pivotController'; // For the dataset/dimension drop-downs

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    // Add your specific workstation URL (without the trailing slash or path)
    'https://9000-firebase-finalys-1773513026000.cluster-2a24trvdezeggvmpy7fccga2ee.cloudworkstations.dev'
  ], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// ==========================================
// MOUNT ROUTES
// ==========================================

// 2. We mount pivotRoutes at the base '/api' path.
// This automatically hooks up:
// GET /api/pivot-data
// POST /api/simulate
// GET /api/adjustments
// DELETE /api/adjustments/:timestampId
app.use('/api', pivotRoutes);

// 3. We also need to mount the drop-down dataset/dimension routes.
// We apply your strict security middleware to these as well.
import { requireAuth } from './middleware/authMiddleware';
import { requireTenant } from './middleware/tenantMiddleware';

app.get(
  '/api/datasets', 
  requireAuth, 
  requireTenant, 
  pivotController.getAvailableDatasets
);

app.get(
  '/api/dimensions', 
  requireAuth, 
  requireTenant, 
  pivotController.getDimensionMapping
);

// ==========================================
// START SERVER
// ==========================================

// Force Express to bind to IPv4 correctly
app.listen(PORT as number, '0.0.0.0', () => {
  logger.info(`SaaS API Layer listening on http://127.0.0.1:${PORT}`);
});
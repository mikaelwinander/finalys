import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { pivotController } from '../controllers/pivotController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Define the route, applying authentication and tenant verification middleware first
// Example request: GET /api/pivot-data
router.get(
  '/pivot-data',
  requireAuth,     // Verifies Identity Platform token
  requireTenant,   // Ensures tenant isolation
  pivotController.getPivotData // Executes caching and query logic
);

router.post('/simulate', simulationController.processAdjustment);

export default router;
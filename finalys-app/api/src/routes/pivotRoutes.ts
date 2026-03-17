import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { pivotController } from '../controllers/pivotController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { templateController } from '../controllers/templateController';

const router = Router();

// Define the route, applying authentication and tenant verification middleware first
// Example request: GET /api/pivot/pivot-data
router.get(
  '/pivot-data',
  requireAuth,     // Verifies Identity Platform token
  requireTenant,   // Ensures tenant isolation
  pivotController.getPivotData // Executes caching and query logic
);

// --- SIMULATION & AUDIT TRAIL ROUTES ---
// We MUST include requireAuth and requireTenant here too!
router.post(
  '/simulate', 
  requireAuth, 
  requireTenant, 
  simulationController.processAdjustment
);

router.get(
  '/adjustments', 
  requireAuth, 
  requireTenant, 
  simulationController.getHistory
);

router.delete(
  '/adjustments/:timestampId', 
  requireAuth, 
  requireTenant, 
  simulationController.undoAdjustment
);

router.post('/templates', requireAuth, requireTenant, templateController.saveTemplate);
router.get('/templates', requireAuth, requireTenant, templateController.getTemplates);

export default router;
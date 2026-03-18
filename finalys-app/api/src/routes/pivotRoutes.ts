import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { pivotController } from '../controllers/pivotController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';
import { templateController } from '../controllers/templateController';
import { requireAdmin } from '../middleware/rbacMiddleware';


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

// GET and POST (Loading and Saving)
router.get('/templates', requireAuth, requireTenant, templateController.getTemplates);
router.post('/templates', requireAuth, requireTenant, templateController.saveTemplate);

// PUT (The new Overwrite/Rename route!)
router.put('/templates/:templateId', requireAuth, requireTenant, templateController.updateTemplate);

// DELETE
router.delete('/templates/:templateId', requireAuth, requireTenant, templateController.deleteTemplate);

export default router;
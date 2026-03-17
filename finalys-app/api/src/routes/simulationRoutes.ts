// /api/src/routes/simulationRoutes.ts
import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// Ensure these middlewares are applied to protect the routes
router.use(requireAuth);
router.use(requireTenant);

// POST /simulate (from frontend) maps here if mounted correctly in server.ts
router.post('/simulate', simulationController.processAdjustment);

// GET /adjustments
router.get('/adjustments', simulationController.getHistory);

// DELETE /adjustments/:timestampId
router.delete('/adjustments/:timestampId', simulationController.undoAdjustment);

export default router;
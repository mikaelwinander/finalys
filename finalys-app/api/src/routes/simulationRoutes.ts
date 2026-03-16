import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();

// FIX: Changed createSimulation to processAdjustment
router.post('/', requireAuth, requireTenant, simulationController.processAdjustment);

export default router;
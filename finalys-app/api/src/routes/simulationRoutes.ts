import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();
router.post('/', requireAuth, requireTenant, simulationController.createSimulation);
    
export default router;
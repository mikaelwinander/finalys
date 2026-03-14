import { Router } from 'express';
import { datasetController } from '../controllers/datasetController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireTenant } from '../middleware/tenantMiddleware';

const router = Router();
router.get('/', requireAuth, requireTenant, datasetController.getDatasets);

export default router;
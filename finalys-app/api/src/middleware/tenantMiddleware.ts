// /api/src/middleware/tenantMiddleware.ts
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { logger } from '../utils/logger';

export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Ensure authMiddleware ran first
  if (!req.user) {
    logger.error('requireTenant called before requireAuth');
    res.status(500).json({ error: 'Internal Server Error: Missing user context' });
    return;
  }

  // Enforce tenant isolation
  if (!req.user.tenantId) {
    logger.warn(`User ${req.user.uid} attempted access without a tenant_id claim`);
    res.status(403).json({ error: 'Forbidden: Tenant context is required for this action' });
    return;
  }

  // Pass control to the controller
  next();
};
// /api/src/middleware/authMiddleware.ts
import { Response, NextFunction } from 'express';
import { authAdmin } from '../config/identityConfig';
import { AuthenticatedRequest } from '../types/api.types';
import { logger } from '../utils/logger';

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  // --- LOCAL DEV BYPASS ---
  if (process.env.NODE_ENV !== 'production') {
    req.user = {
      uid: 'local-dev-user',
      tenantId: 'FIN', // This MUST match a tenant_id that actually exists in your BigQuery data
      roles: ['admin']
    };
    next();
    return;
  }
  // --- END BYPASS --- 

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // 1. Token validation against Identity Platform
    const decodedToken = await authAdmin.verifyIdToken(idToken);

    // 2. Extraction of identity information
    req.user = {
      uid: decodedToken.uid,
      tenantId: decodedToken.tenant_id as string,
      roles: (decodedToken.roles as string[]) || [],
      email: decodedToken.email,
    };

    next();
  } catch (error) {
    logger.error('Authentication failed', { error });
    res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
};
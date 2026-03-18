import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  // Extract the roles array from the token claims we defined in api.types.ts
  const roles = req.user?.roles || [];
  
  // Check if they have the admin badge (adjust 'admin' if your claim uses a different string like 'Administrator')
  if (!roles.includes('admin')) {
    res.status(403).json({ error: 'Forbidden: Only Administrators can modify templates.' });
    return;
  }
  
  next(); // They are an admin! Let them through.
};
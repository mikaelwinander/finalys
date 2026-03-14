// /api/src/types/api.types.ts
import { Request } from 'express';

// Represents the custom claims embedded in the Identity Platform token
export interface IdentityClaims {
  tenant_id: string;
  roles: string[];
}

export interface AuthenticatedUser {
  uid: string;
  tenantId: string;
  roles: string[];
  email?: string;
}

// Extends the standard Express Request to include our validated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
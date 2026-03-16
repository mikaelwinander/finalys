// /api/src/types/api.types.ts
import { Request } from 'express';

// Represents the custom claims embedded in the Identity Platform token
export interface IdentityClaims {
  client_id: string; // Updated from tenant_id
  roles: string[];
}

export interface AuthenticatedUser {
  uid: string;
  clientId: string;  // Updated from tenantId
  roles: string[];
  email?: string;
}

// Extends the standard Express Request to include our validated user
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
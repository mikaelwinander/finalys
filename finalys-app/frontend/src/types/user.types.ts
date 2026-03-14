// /frontend/src/types/user.types.ts

export interface AppUser {
    uid: string;
    email: string | null;
    displayName: string | null;
    tenantId: string | null; // Crucial for multi-tenant isolation
  }
  
  export interface AuthContextState {
    user: AppUser | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
  }
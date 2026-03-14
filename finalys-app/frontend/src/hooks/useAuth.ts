// /frontend/src/hooks/useAuth.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, getIdToken, getIdTokenResult } from 'firebase/auth';
import { auth } from '../config/environment';
import type { AppUser, AuthContextState } from '../types/user.types';

// Create the Context with a default empty state
const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // Subscribe to Identity Platform auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Retrieve the JWT token needed for the API layer
            const token = await getIdToken(firebaseUser);
            
            // Retrieve custom claims (where tenant_id is typically stored in SaaS setups)
            const tokenResult = await getIdTokenResult(firebaseUser);
            const tenantId = (tokenResult.claims.tenant_id as string) || null;

            const appUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              tenantId: tenantId,
            };

            setState({ user: appUser, token, isLoading: false, error: null });
          } catch (error: any) {
            setState({ user: null, token: null, isLoading: false, error: error.message });
          }
        } else {
          // User is signed out
          setState({ user: null, token: null, isLoading: false, error: null });
        }
      },
      (error) => {
        setState({ user: null, token: null, isLoading: false, error: error.message });
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return React.createElement(AuthContext.Provider, { value: state }, children);
};

/**
 * Custom hook to securely access authentication state and API tokens.
 */
export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
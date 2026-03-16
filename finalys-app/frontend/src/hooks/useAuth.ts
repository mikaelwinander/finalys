// /frontend/src/hooks/useAuth.ts
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser, getIdToken, getIdTokenResult } from 'firebase/auth';
import { auth } from '../config/environment';
import type { AppUser, AuthContextState } from '../types/user.types';

const AuthContext = createContext<AuthContextState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            const token = await getIdToken(firebaseUser);
            const tokenResult = await getIdTokenResult(firebaseUser);
            
            const clientId = (tokenResult.claims.client_id as string) || (tokenResult.claims.tenant_id as string) || null;

            const appUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              clientId: clientId,
            };

            setState({ user: appUser, token, isLoading: false, error: null });
          } catch (error: any) {
            setState({ user: null, token: null, isLoading: false, error: error.message });
          }
        } else {
          // --- LOCAL DEV BYPASS ---
          // If not logged in, but we are in local development, spoof a dev user/token
          if (import.meta.env.DEV) {
            console.warn("⚠️ Local Dev Mode: Bypassing Identity Platform Auth");
            setState({ 
              user: { uid: 'local-dev-user', email: 'dev@local.com', displayName: 'Dev User', clientId: 'FIN' }, 
              token: 'local-dummy-token', 
              isLoading: false, 
              error: null 
            });
          } else {
            // Production behavior: Actually log them out
            setState({ user: null, token: null, isLoading: false, error: null });
          }
        }
      },
      (error) => {
        setState({ user: null, token: null, isLoading: false, error: error.message });
      }
    );

    return () => unsubscribe();
  }, []);

  return React.createElement(AuthContext.Provider, { value: state }, children);
};

export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
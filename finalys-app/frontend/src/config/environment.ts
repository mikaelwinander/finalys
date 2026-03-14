// /frontend/src/config/environment.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// These values come from your Firebase/Identity Platform console.
// They are safe to expose in the frontend client.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-app",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abc123def456",
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase Auth
export const auth = getAuth(app);
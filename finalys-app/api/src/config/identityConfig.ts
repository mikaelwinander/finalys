// /api/src/config/identityConfig.ts
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK.
admin.initializeApp();

export const authAdmin = admin.auth();
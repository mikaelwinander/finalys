// /api/src/utils/logger.ts

/**
 * Placeholder logger implementation.
 * Wraps standard console methods for easy replacement with a production
 * logging library (e.g., Pino, Winston, or Google Cloud Logging) later.
 */
export const logger = {
    info: (message: string, meta?: any): void => {
      if (meta) {
        console.log(`[INFO] ${message}`, meta);
      } else {
        console.log(`[INFO] ${message}`);
      }
    },
  
    warn: (message: string, meta?: any): void => {
      if (meta) {
        console.warn(`[WARN] ${message}`, meta);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    },
  
    error: (message: string, meta?: any): void => {
      if (meta) {
        console.error(`[ERROR] ${message}`, meta);
      } else {
        console.error(`[ERROR] ${message}`);
      }
    },
  
    debug: (message: string, meta?: any): void => {
      // Debug logs might be noisy, can be toggled via environment variables later
      if (process.env.NODE_ENV !== 'production') {
        if (meta) {
          console.debug(`[DEBUG] ${message}`, meta);
        } else {
          console.debug(`[DEBUG] ${message}`);
        }
      }
    }
  };
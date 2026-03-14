import crypto from 'crypto';

/**
 * Creates a deterministic SHA-256 hash from any JSON-serializable object.
 */
const hashObject = (obj: any): string => {
  if (!obj) return 'none';
  const str = typeof obj === 'string' ? obj : JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(str).digest('hex').substring(0, 16);
};

export const cacheKeyBuilder = {
  /**
   * Builds the deterministic pivot cache key
   * Format: pivot:{tenantId}:{datasetId}:{dimensionHash}:{filterHash}
   */
  buildPivotKey(
    tenantId: string, 
    datasetId: string, 
    dimensions: any, 
    filters: any
  ): string {
    const dimHash = hashObject(dimensions);
    const filterHash = hashObject(filters);
    
    return `pivot:${tenantId}:${datasetId}:${dimHash}:${filterHash}`;
  }
};
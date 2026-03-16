// /api/src/utils/cacheKeyBuilder.ts
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
   * Builds the deterministic pivot cache key for multiple datasets
   * Format: pivot:{clientId}:{datasetIdsHash}:{dimHash}:{measureHash}:{filterHash}:adj:{includeAdj}
   */
  buildPivotKey(
    clientId: string,
    datasetIds: string[], 
    dimensions: string[], 
    measures: string[],
    filters: Record<string, any>,
    includeAdjustments: boolean
  ): string {
    // Sort dataset IDs to guarantee deterministic caching
    const sortedDatasets = [...datasetIds].sort();
    
    const datasetHash = hashObject(sortedDatasets);
    const dimHash = hashObject(dimensions);
    const measureHash = hashObject(measures);
    const filterHash = hashObject(filters);
    
    return `pivot:${clientId}:${datasetHash}:${dimHash}:${measureHash}:${filterHash}:adj:${includeAdjustments}`;
  }
};
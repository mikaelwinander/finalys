// /api/src/controllers/pivotController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { cacheKeyBuilder } from '../utils/cacheKeyBuilder';
import { cacheService } from '../services/cacheService';
import { bigqueryService, PivotQueryRequest } from '../services/bigqueryService';
import { logger } from '../utils/logger';

export const pivotController = {
  /**
   * Handles GET requests for pivot table data.
   * Expects query parameters: datasetId, dimensions, measures, filters.
   */
  async getPivotData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 1. Extract guaranteed tenant and user context from middleware
      const tenantId = req.user!.tenantId;
      const userId = req.user!.uid;

      // 2. Parse query parameters (handling stringified JSON arrays/objects from GET request)
      const datasetId = req.query.datasetId as string;
      const dimensions = req.query.dimensions ? JSON.parse(req.query.dimensions as string) : [];
      const measures = req.query.measures ? JSON.parse(req.query.measures as string) : [];
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      if (!datasetId || !dimensions.length || !measures.length) {
        res.status(400).json({ error: 'Missing required parameters: datasetId, dimensions, or measures' });
        return;
      }

      // 3. Construct deterministic cache key
      const cacheKey = cacheKeyBuilder.buildPivotKey(tenantId, datasetId, dimensions, filters);

      // 4. Check Redis cache
      const cachedResult = await cacheService.get<any[]>(cacheKey);

      if (cachedResult) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        // Return result in milliseconds
        res.status(200).json({ rows: cachedResult });
        return;
      }

      logger.debug(`Cache MISS for key: ${cacheKey}. Querying BigQuery...`);

      // 5. Query BigQuery if cache miss
      const bqRequest: PivotQueryRequest = {
        tenantId,
        userId,
        datasetId,
        dimensions,
        measures
      };

      // Removed <any> here to strictly match the service definition
      const rows = await bigqueryService.getPivotAggregation(bqRequest);

      // 6. Cache the result for future requests
      await cacheService.set(cacheKey, rows);

      // 7. Return summarized result to frontend
      res.status(200).json({ rows });

    } catch (error: any) {
      logger.error('Error in getPivotData controller', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while processing analytics data' });
    }
  },

  /**
   * Handles GET requests for available datasets (versions).
   */
  async getAvailableDatasets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tenantId = req.user!.tenantId;
      const cacheKey = `datasets:${tenantId}`;
      
      // Check Redis Cache
      const cachedDatasets = await cacheService.get<string[]>(cacheKey);
      if (cachedDatasets) {
        res.status(200).json({ data: cachedDatasets });
        return;
      }

      // We call the service here instead of using bqClient directly!
      const datasets = await bigqueryService.getAvailableDatasets(tenantId);
      
      // Save to Cache for 1 hour (3600 seconds)
      await cacheService.set(cacheKey, datasets, 3600);
      
      res.status(200).json({ data: datasets });
    } catch (error: any) {
      logger.error('Failed to fetch available datasets in controller', { error: error.message });
      res.status(500).json({ error: 'Could not retrieve datasets' });
    }
  }
};
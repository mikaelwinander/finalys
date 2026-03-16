// /api/src/controllers/pivotController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { cacheKeyBuilder } from '../utils/cacheKeyBuilder';
import { cacheService } from '../services/cacheService';
import { bigqueryService, PivotQueryRequest } from '../services/bigqueryService';
import { logger } from '../utils/logger';

export const pivotController = {
  async getPivotData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Changed from tenantId to clientId
      const clientId = req.user!.clientId; 
      const userId = req.user!.uid;

      const datasetId = req.query.datasetId as string;
      const dimensions = req.query.dimensions ? JSON.parse(req.query.dimensions as string) : [];
      const measures = req.query.measures ? JSON.parse(req.query.measures as string) : [];
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      if (!datasetId || !dimensions.length || !measures.length) {
        res.status(400).json({ error: 'Missing required parameters: datasetId, dimensions, or measures' });
        return;
      }

      // Ensure cacheKeyBuilder is also updated to use clientId internally
      const cacheKey = cacheKeyBuilder.buildPivotKey(clientId, datasetId, dimensions, filters);

      const cachedResult = await cacheService.get<any[]>(cacheKey);

      if (cachedResult) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        res.status(200).json({ rows: cachedResult });
        return;
      }

      logger.debug(`Cache MISS for key: ${cacheKey}. Querying BigQuery...`);

      const bqRequest: PivotQueryRequest = {
        clientId,
        userId,
        datasetId,
        dimensions,
        measures
      };

      const rows = await bigqueryService.getPivotAggregation(bqRequest);

      await cacheService.set(cacheKey, rows);

      res.status(200).json({ rows });

    } catch (error: any) {
      logger.error('Error in getPivotData controller', { error: error.message });
      res.status(500).json({ error: 'Internal Server Error while processing analytics data' });
    }
  },

  async getAvailableDatasets(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      const cacheKey = `datasets:${clientId}`; // Updated cache key prefix
      
      const cachedDatasets = await cacheService.get<string[]>(cacheKey);
      if (cachedDatasets) {
        res.status(200).json({ data: cachedDatasets });
        return;
      }

      const datasets = await bigqueryService.getAvailableDatasets(clientId);
      
      await cacheService.set(cacheKey, datasets, 3600);
      
      res.status(200).json({ data: datasets });
    } catch (error: any) {
      logger.error('Failed to fetch available datasets in controller', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * Handles GET requests for dimension mapping metadata.
   */
  async getDimensionMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      const cacheKey = `dimensions:${clientId}`;
      
      // 1. Check Redis Cache
      const cachedMapping = await cacheService.get<any[]>(cacheKey);
      if (cachedMapping) {
        res.status(200).json({ data: cachedMapping });
        return;
      }

      // 2. Query BigQuery via Service
      const mapping = await bigqueryService.getDimensionMapping(clientId);
      
      // 3. Cache for 24 hours (metadata changes rarely)
      await cacheService.set(cacheKey, mapping, 86400); 
      
      res.status(200).json({ data: mapping });
    } catch (error: any) {
      logger.error('Failed to fetch dimension mapping', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
};
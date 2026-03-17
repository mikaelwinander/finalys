// /api/src/controllers/pivotController.ts
import { Response } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
import { cacheKeyBuilder } from '../utils/cacheKeyBuilder';
import { cacheService } from '../services/cacheService';
import { bigqueryService, PivotQueryRequest } from '../services/bigqueryService';
import { templateService } from '../services/templateService'; // <--- NEW IMPORT
import { logger } from '../utils/logger';

export const pivotController = {
  async getPivotData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Identity Extraction
      const clientId = req.user!.clientId; 
      const userId = req.user!.uid;

      // 1. FIXED: Extract datasetIds as an array, and includeAdjustments as a boolean
      const datasetIds: string[] = req.query.datasetIds ? JSON.parse(req.query.datasetIds as string) : [];
      const includeAdjustments: boolean = req.query.includeAdjustments === 'true';
      const templateId = req.query.templateId as string | undefined; 
      const dimensions: string[] = req.query.dimensions ? JSON.parse(req.query.dimensions as string) : [];
      const measures: string[] = req.query.measures ? JSON.parse(req.query.measures as string) : [];
      let filters: Record<string, any> = req.query.filters ? JSON.parse(req.query.filters as string) : {};

      // FIXED: Check datasetIds.length instead of !datasetId
      if (!datasetIds.length || !dimensions.length || !measures.length) {
        res.status(400).json({ error: 'Missing required parameters: datasetIds, dimensions, or measures' });
        return;
      }

      // ==========================================
      // TEMPLATE VALIDATION GUARDRAIL (Remains unchanged)
      // ==========================================
      if (templateId) {
        const template = await templateService.getTemplate(clientId, templateId);
        if (!template) { res.status(404).json({ error: 'Template not found' }); return; }

        const invalidDims = dimensions.filter(dim => !template.allowedDimensions.includes(dim));
        if (invalidDims.length > 0) {
          logger.warn(`Security Event: User ${userId} requested restricted dimensions: ${invalidDims.join(', ')}`);
          res.status(403).json({ error: `Forbidden: Dimensions [${invalidDims.join(', ')}] are not permitted.` });
          return;
        }

        const invalidMeasures = measures.filter(m => !template.allowedMeasures.includes(m));
        if (invalidMeasures.length > 0) {
          res.status(403).json({ error: `Forbidden: Measures [${invalidMeasures.join(', ')}] are not permitted.` });
          return;
        }

        if (template.mandatoryFilters) {
          filters = { ...filters, ...template.mandatoryFilters };
        }
      }
      // ==========================================

      // 2. FIXED: Pass all 6 required arguments to the cacheKeyBuilder
      const cacheKey = cacheKeyBuilder.buildPivotKey(
        clientId, 
        datasetIds, 
        dimensions, 
        measures, 
        filters, 
        includeAdjustments
      );

      const cachedResult = await cacheService.get<any[]>(cacheKey);

      if (cachedResult) {
        logger.debug(`Cache HIT for key: ${cacheKey}`);
        res.status(200).json({ rows: cachedResult });
        return;
      }

      logger.debug(`Cache MISS for key: ${cacheKey}. Querying BigQuery...`);

      // 3. FIXED: Pass datasetIds (array) and includeAdjustments to the BigQuery request
      const bqRequest: PivotQueryRequest = {
        clientId,
        userId,
        datasetIds,
        dimensions,
        measures,
        filters, 
        includeAdjustments 
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
      const cacheKey = `datasets:${clientId}`;
      
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

  async getDimensionMapping(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const clientId = req.user!.clientId;
      // Bumping to v4 to guarantee a cache bypass
      const cacheKey = `dimensions_v4:${clientId}`; 
      
      const cachedMapping = await cacheService.get<any[]>(cacheKey);
      if (cachedMapping) {
        logger.info(`[CONTROLLER] Returning CACHED data for ${cacheKey}`);
        res.status(200).json({ data: cachedMapping });
        return;
      }

      logger.info(`[CONTROLLER] Cache MISS for ${cacheKey}. Calling BigQuery Service...`);
      const mapping = await bigqueryService.getDimensionMapping(clientId);
      
      await cacheService.set(cacheKey, mapping, 86400); 
      res.status(200).json({ data: mapping });
    } catch (error: any) {
      logger.error('Failed to fetch dimension mapping', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  }
};
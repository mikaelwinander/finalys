// /api/src/server.ts
import express from 'express';
import cors from 'cors';
import { bigqueryService, PivotQueryRequest } from './services/bigqueryService';
import { cacheService } from './services/cacheService';
import { logger } from './utils/logger';
import { simulationService } from './services/simulationService';
import { aiService } from './services/aiService';
import { cacheKeyBuilder } from './utils/cacheKeyBuilder';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// --- ROUTES ---

// 1. Get Available Datasets Route
app.get('/api/datasets', async (req, res) => {
  try {
    const tenantId = 'FIN'; // Hardcoded for current testing phase
    const cacheKey = `datasets:${tenantId}`;
    
    // Check Redis Cache
    const cachedDatasets = await cacheService.get<string[]>(cacheKey);
    if (cachedDatasets) {
      return res.json({ data: cachedDatasets });
    }

    // Fetch from BigQuery if cache misses
    const datasets = await bigqueryService.getAvailableDatasets(tenantId);
    
    // Save to Cache for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, JSON.stringify(datasets), 3600);
    
    res.json({ data: datasets });
  } catch (error) {
    logger.error('Route /api/datasets failed', { error });
    res.status(500).json({ error: 'Failed to load datasets' });
  }
});

// --- NEW: Get Dimension Mapping Route ---
app.get('/api/dimensions', async (req, res) => {
  try {
    const tenantId = 'FIN'; // Hardcoded for current testing phase
    const cacheKey = `dimensions:${tenantId}`;
    
    // Check Redis Cache
    const cachedDims = await cacheService.get<any>(cacheKey);
    if (cachedDims) {
      // Safely parse the cache string back to an array
      const parsedDims = typeof cachedDims === 'string' ? JSON.parse(cachedDims) : cachedDims;
      return res.json({ data: parsedDims });
    }

    // Fetch from BigQuery if cache misses
    const dims = await bigqueryService.getDimensionMapping(tenantId);
    
    // Save to Cache for 1 hour (3600 seconds)
    await cacheService.set(cacheKey, JSON.stringify(dims), 3600);
    
    res.json({ data: dims });
  } catch (error) {
    logger.error('Route /api/dimensions failed', { error });
    res.status(500).json({ error: 'Failed to load dimensions' });
  }
});

// 2. Get Pivot Data Route
app.get('/api/pivot-data', async (req, res) => {
  try {
    const tenantId = 'FIN'; // Hardcoded for current testing phase
    
    // Parse datasetIds as an array (expected format: ?datasetIds=["ds1","ds2"])
    const datasetIds: string[] = JSON.parse((req.query.datasetIds as string) || '[]');
    const dimensions: string[] = JSON.parse((req.query.dimensions as string) || '[]');
    const measures: string[] = JSON.parse((req.query.measures as string) || '[]');
    const filters: Record<string, any> = req.query.filters ? JSON.parse(req.query.filters as string) : {};
    const includeAdjustments = req.query.includeAdjustments !== 'false';

    if (!datasetIds.length || !dimensions.length || !measures.length) {
      return res.status(400).json({ error: 'Missing required parameters: datasetIds, dimensions, or measures' });
    }

    // Use the centralized, deterministic cache builder
    const cacheKey = cacheKeyBuilder.buildPivotKey(
      tenantId, 
      datasetIds, 
      dimensions, 
      measures, 
      filters, 
      includeAdjustments
    );
    
    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      logger.debug(`Cache HIT for key: ${cacheKey}`);
      const parsedData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      return res.json({ rows: parsedData }); 
    }

    logger.debug(`Cache MISS for key: ${cacheKey}. Querying BigQuery...`);
    
    const requestPayload: PivotQueryRequest = {
      clientId: tenantId,
      userId: 'system',
      datasetIds: datasetIds, // Passed as array
      dimensions: dimensions,
      measures: measures,
      filters: filters,
      includeAdjustments: includeAdjustments
    };

    const data = await bigqueryService.getPivotAggregation(requestPayload);
    
    await cacheService.set(cacheKey, JSON.stringify(data), 3600);
    
    res.json({ rows: data }); 
  } catch (error) {
    logger.error('Route /api/pivot-data failed', { error });
    res.status(500).json({ error: 'Failed to load pivot data' });
  }
});

// --- 3. CREATE SIMULATION ROUTE ---
app.post('/api/simulate', async (req, res) => {
  try {
    const tenantId = 'FIN'; // Matching your other routes
    const userId = 'system';
    const { datasetId, coordinates, oldValue, userInput } = req.body;

    // Translate coordinates
    const mappings = await bigqueryService.getDimensionMapping(tenantId);
    const translatedCoordinates: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(coordinates as Record<string, string>)) {
      if (key === 'period' || key === 'period_id') {
        translatedCoordinates['period_id'] = value;
      } else {
        const mapping = mappings.find(m => m.dim_id === key);
        if (mapping) {
          const physicalCol = `dim${String(mapping.position).padStart(2, '0')}`;
          translatedCoordinates[physicalCol] = value;
        }
      }
    }

    let newValue: number;
    if (!isNaN(Number(userInput))) {
      newValue = Number(userInput);
    } else if (userInput.includes('%')) {
      const percent = parseFloat(userInput) / 100;
      newValue = oldValue * (1 + percent);
    } else {
      newValue = await aiService.interpretInstruction(oldValue, userInput);
    }

    await simulationService.spreadAdjustment({
      clientId: tenantId,
      userId,
      datasetId,
      coordinates: translatedCoordinates,
      totalOldValue: oldValue,
      totalNewValue: newValue,
      comment: `Simulation: ${userInput}`
    });

    await cacheService.invalidateClientCache(tenantId);
    res.status(200).json({ newValue });
  } catch (error: any) {
    logger.error('Route /api/simulate failed', { error });
    res.status(500).json({ error: error.message });
  }
});

// --- 4. GET AUDIT TRAIL HISTORY ---
app.get('/api/adjustments', async (req, res) => {
  try {
    const tenantId = 'FIN';
    const { datasetId } = req.query;
    
    const history = await simulationService.getHistory(tenantId, String(datasetId));
    res.status(200).json(history);
  } catch (error: any) {
    logger.error('Route /api/adjustments failed', { error });
    res.status(500).json({ error: error.message });
  }
});

// --- 5. UNDO SIMULATION ROUTE ---
app.delete('/api/adjustments/:timestampId', async (req, res) => {
  try {
    const tenantId = 'FIN';
    const { timestampId } = req.params;
    const { datasetId } = req.body;

    await simulationService.undoAdjustment(tenantId, String(datasetId), String(timestampId));
    await cacheService.invalidateClientCache(tenantId);
    
    res.status(200).json({ message: 'Simulation undone successfully' });
  } catch (error: any) {
    logger.error('Route DELETE /api/adjustments failed', { error });
    res.status(500).json({ error: error.message });
  }
});

// Force Express to bind to IPv4 correctly
app.listen(PORT as number, '0.0.0.0', () => {
  logger.info(`SaaS API Layer listening on http://127.0.0.1:${PORT}`);
});
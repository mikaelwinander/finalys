// /api/src/server.ts
import express from 'express';
import cors from 'cors';
import { bigqueryService, PivotQueryRequest } from './services/bigqueryService';
import { cacheService } from './services/cacheService';
import { logger } from './utils/logger';

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
    const datasetId = req.query.datasetId as string;
    
    const dimensions = JSON.parse((req.query.dimensions as string) || '[]');
    const measures = JSON.parse((req.query.measures as string) || '[]');
    // --- FIX 1: PARSE THE FILTERS FROM THE URL ---
    const filters = req.query.filters ? JSON.parse(req.query.filters as string) : {};

    if (!datasetId || !dimensions.length || !measures.length) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Include filters in the cache key so different filters don't share the same cache!
    const cacheKey = `pivot:${tenantId}:${datasetId}:${dimensions.join(',')}:${measures.join(',')}:${JSON.stringify(filters)}`;
    
    const cachedData = await cacheService.get<any[]>(cacheKey);
    if (cachedData) {
      logger.debug(`Cache HIT for key: ${cacheKey}`);

      const parsedData = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;

      return res.json({ rows: parsedData }); 
    }

    logger.debug(`Cache MISS for key: ${cacheKey}. Querying BigQuery...`);
    
    const requestPayload: PivotQueryRequest = {
      tenantId: tenantId,
      userId: 'system',
      datasetId: datasetId,
      dimensions: dimensions,
      measures: measures,
      filters: filters // Pass the parsed filters to BigQuery
    };

    const data = await bigqueryService.getPivotAggregation(requestPayload);
    
    await cacheService.set(cacheKey, JSON.stringify(data), 3600);
    
    // --- FIX 2: RETURN AS 'rows' ---
    res.json({ rows: data }); 
  } catch (error) {
    logger.error('Route /api/pivot-data failed', { error });
    res.status(500).json({ error: 'Failed to load pivot data' });
  }
});

// Force Express to bind to IPv4 correctly
app.listen(PORT as number, '0.0.0.0', () => {
  logger.info(`SaaS API Layer listening on http://127.0.0.1:${PORT}`);
});
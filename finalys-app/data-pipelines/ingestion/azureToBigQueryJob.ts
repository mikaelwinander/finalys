// /data-pipelines/ingestion/azureToBigQueryJob.ts
import 'dotenv/config';
import * as sql from 'mssql';
import { BigQuery } from '@google-cloud/bigquery';
// REMOVED: import { cacheService } from '../../api/src/services/cacheService'; (We will import this dynamically at the end!)
import * as fs from 'fs';
import * as path from 'path';

const sqlConfig: sql.config = {
  user: process.env.AZURE_SQL_USER || 'your_db_user',
  password: process.env.AZURE_SQL_PASSWORD || 'your_db_password',
  database: process.env.AZURE_SQL_DATABASE || 'your_database_name',
  server: process.env.AZURE_SQL_SERVER || 'your_server.database.windows.net',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: { encrypt: true, trustServerCertificate: false }
};

const BQ_PROJECT = 'snbx-efcpa-effectplan-vcdm';
const bqClient = new BigQuery({ projectId: BQ_PROJECT });
const BQ_DATASET = 'finalys_dataset'; 
const BQ_TABLE_FACTS = 'financial_data_view';
const BQ_TABLE_MAPPING = 'dimension_mapping';
const BQ_TABLE_DATA = 'dimension_data';

const TARGET_CLIENT_ID = process.env.TARGET_CLIENT_ID || 'FIN';

interface BqDimMappingRow {
  client_id: string;
  dim_id: string;
  dim_name: string;
  position: number;
}

interface BqDimDataRow {
  client_id: string;
  dim_id: string;
  dim_data_id: string;
  dim_data_name: string;
  sort_index: number | null;
}

export const runAzureToBigQuerySync = async () => {
  console.log(`[ETL] Starting ingestion job for ClientId: ${TARGET_CLIENT_ID}...`);
  let pool: sql.ConnectionPool | undefined;
  const tempFilePath = path.join(__dirname, `temp_sync_${TARGET_CLIENT_ID}.json`);

  try {
    pool = await sql.connect(sqlConfig);
    console.log('[ETL] Connected to Azure SQL.');

    // ==========================================
    // STEP 1: SYNC FINANCIAL FACTS
    // ==========================================
    console.log('[ETL] Extracting Fact Data...');
    const request = pool.request();
    request.input('clientId', sql.NVarChar, TARGET_CLIENT_ID);
    request.stream = true; 

    const writeStream = fs.createWriteStream(tempFilePath);
    let rowCount = 0;

    await new Promise<void>((resolve, reject) => {
      request.query(`
        SELECT 
          pd.ClientId AS client_id,
          pd.PlanVersionId AS dataset_id,
          pd.PeriodId AS period_id,
          pd.AmountTypeId AS amount_type_id,
          pd.Dim01 AS dim01, pd.Dim02 AS dim02, pd.Dim03 AS dim03,
          pd.Dim04 AS dim04, pd.Dim05 AS dim05, pd.Dim06 AS dim06,
          pd.Dim07 AS dim07, pd.Dim08 AS dim08, pd.Dim09 AS dim09,
          pd.Dim10 AS dim10, pd.Dim11 AS dim11, pd.Dim12 AS dim12,
          CAST(pd.Amount AS FLOAT) AS amount
        FROM dbo.xp_view_plandata pd
        WHERE pd.ClientId = @clientId
      `);
      
      request.on('row', (row) => {
        writeStream.write(JSON.stringify(row) + '\n');
        rowCount++;
      });

      request.on('error', reject);
      request.on('done', () => { writeStream.end(); resolve(); });
    });

    if (rowCount > 0) {
      console.log(`[ETL] Loading ${rowCount} fact rows into BigQuery...`);
      
      // Safety Check: Only delete if the table exists
      try {
        await bqClient.query({
          query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_FACTS}\` WHERE client_id = @clientId`,
          params: { clientId: TARGET_CLIENT_ID }
        });
      } catch (err: any) {
        if (err.message && err.message.includes('Not found')) {
           console.log(`[ETL] Table ${BQ_TABLE_FACTS} not found. It will be created automatically.`);
        } else {
           throw err;
        }
      }
      
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_FACTS).load(tempFilePath, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: false, // Switched to true so it builds the schema if missing
        writeDisposition: 'WRITE_APPEND',
      });
      console.log(`[ETL] Fact load complete.`);
    }

    // ==========================================
    // STEP 2: SYNC DIMENSION MAPPING (FIXED FOR BQ BUFFER & MISSING TABLES)
    // ==========================================
    const dimsResult = await pool.request()
      .input('clientId', sql.NVarChar, TARGET_CLIENT_ID)
      .query<BqDimMappingRow>(`
        SELECT 
          ClientId AS client_id,
          LOWER(DimId) AS dim_id, 
          DimName AS dim_name, 
          Position AS position
        FROM dbo.xp_view_dim_map
        WHERE ClientId = @clientId
      `);
    
    if (dimsResult.recordset.length > 0) {
      // 1. Delete old rows (Gracefully handle the streaming buffer hangover & missing tables)
      try {
        await bqClient.query({
          query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_MAPPING}\` WHERE client_id = @clientId`,
          params: { clientId: TARGET_CLIENT_ID }
        });
      } catch (err: any) {
        if (err.message && err.message.includes('streaming buffer')) {
          console.warn(`[ETL WARNING] Buffer lock active on mapping table. Skipping DELETE. (Clears in ~60 mins)`);
        } else if (err.message && err.message.includes('Not found')) {
           console.log(`[ETL] Table ${BQ_TABLE_MAPPING} not found. It will be created automatically.`);
        } else {
          throw err;
        }
      }

      // 2. Write array to a temporary JSONL file
      const mapTempFile = path.join(__dirname, `temp_map_${TARGET_CLIENT_ID}.json`);
      fs.writeFileSync(mapTempFile, dimsResult.recordset.map(row => JSON.stringify(row)).join('\n'));

      // 3. Batch Load (Bypasses Streaming Buffer!)
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_MAPPING).load(mapTempFile, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: false, // Build schema if missing
        writeDisposition: 'WRITE_APPEND',
      });
      fs.unlinkSync(mapTempFile); // Clean up
      console.log(`[ETL] Loaded ${dimsResult.recordset.length} dimension mappings.`);
    }

    // ==========================================
    // STEP 3: SYNC DIMENSION DATA MEMBERS (FIXED FOR BQ BUFFER & MISSING TABLES)
    // ==========================================
    const dataResult = await pool.request()
      .input('clientId', sql.NVarChar, TARGET_CLIENT_ID)
      .query<BqDimDataRow>(`
        SELECT 
          ClientId AS client_id,
          LOWER(DimDefinitionId) AS dim_id,
          DimDataId AS dim_data_id,
          DimDataName AS dim_data_name,
          NULL AS sort_index
        FROM dbo.xp_view_dim_data
        WHERE ClientId = @clientId
      `);
    
    if (dataResult.recordset.length > 0) {
      // 1. Delete old rows (Gracefully handle the streaming buffer hangover & missing tables)
      try {
        await bqClient.query({
          query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_DATA}\` WHERE client_id = @clientId`,
          params: { clientId: TARGET_CLIENT_ID }
        });
      } catch (err: any) {
        if (err.message && err.message.includes('streaming buffer')) {
          console.warn(`[ETL WARNING] Buffer lock active on data table. Skipping DELETE. (Clears in ~60 mins)`);
        } else if (err.message && err.message.includes('Not found')) {
           console.log(`[ETL] Table ${BQ_TABLE_DATA} not found. It will be created automatically.`);
        } else {
          throw err;
        }
      }

      // 2. Write array to a temporary JSONL file
      const dataTempFile = path.join(__dirname, `temp_data_${TARGET_CLIENT_ID}.json`);
      fs.writeFileSync(dataTempFile, dataResult.recordset.map(row => JSON.stringify(row)).join('\n'));

      // 3. Batch Load (Bypasses Streaming Buffer!)
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_DATA).load(dataTempFile, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: false, // Build schema if missing
        writeDisposition: 'WRITE_APPEND',
      });
      fs.unlinkSync(dataTempFile); // Clean up
      console.log(`[ETL] Loaded ${dataResult.recordset.length} dimension data members.`);
    }

    console.log('[ETL] Pipeline completed successfully!');
    
    // ==========================================
    // STEP 4: GRACEFUL CACHE INVALIDATION
    // ==========================================
    console.log(`[ETL] Attempting to trigger cache invalidation for ${TARGET_CLIENT_ID}...`);
    try {
      // Dynamically import the cache service only when we need it
      const { cacheService } = await import('../../api/src/services/cacheService');
      await cacheService.invalidateClientCache(TARGET_CLIENT_ID);
      console.log(`[ETL] Cache successfully cleared.`);
    } catch (cacheError) {
      console.warn(`\n[ETL WARNING] Cache invalidation skipped. 
--> Reason: Could not connect to the Redis server. 
--> Impact: Your API might serve old cached data for a few minutes. 
--> Fix: To enable caching, start a local Redis server (port 6379) or add a cloud REDIS_URL to your .env file.\n`);
    }

  } catch (error: any) {
    console.error('[ETL] Pipeline failed:', error.message);
    if (error.name === 'PartialFailureError' && error.errors) {
      console.error('[ETL] BQ Error details:', JSON.stringify(error.errors[0], null, 2));
    }
    process.exit(1);
  } finally {
    if (pool) await pool.close();
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
};

if (require.main === module) {
  runAzureToBigQuerySync();
}
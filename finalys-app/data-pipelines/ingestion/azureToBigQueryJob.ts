// /data-pipelines/ingestion/azureToBigQueryJob.ts
import 'dotenv/config';
import * as sql from 'mssql';
import { BigQuery } from '@google-cloud/bigquery';
import { cacheService } from '../../api/src/services/cacheService';
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
  position: number; // <--- FIXED: Match BQ schema and SQL query
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
    // STEP 1: SYNC FINANCIAL FACTS (STREAMING FOR HUGE DATA)
    // ==========================================
    console.log('[ETL] Extracting Fact Data...');
    const request = pool.request();
    request.input('clientId', sql.NVarChar, TARGET_CLIENT_ID);
    request.stream = true; // Protects Node.js memory

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
      await bqClient.query({
        query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_FACTS}\` WHERE client_id = @clientId`,
        params: { clientId: TARGET_CLIENT_ID }
      });
      
      // Bulk Load Job (Fast and Cheap)
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_FACTS).load(tempFilePath, {
        sourceFormat: 'NEWLINE_DELIMITED_JSON',
        autodetect: false,
        writeDisposition: 'WRITE_APPEND',
      });
      console.log(`[ETL] Fact load complete.`);
    }

    // ==========================================
    // STEP 2: SYNC DIMENSION MAPPING (SMALL DATA = ARRAY INSERT OK)
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
      await bqClient.query({
        query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_MAPPING}\` WHERE client_id = @clientId`,
        params: { clientId: TARGET_CLIENT_ID }
      });
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_MAPPING).insert(dimsResult.recordset);
      console.log(`[ETL] Loaded ${dimsResult.recordset.length} dimension mappings.`);
    }

    // ==========================================
    // STEP 3: SYNC DIMENSION DATA MEMBERS (SMALL DATA = ARRAY INSERT OK)
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
      await bqClient.query({
        query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_DATA}\` WHERE client_id = @clientId`,
        params: { clientId: TARGET_CLIENT_ID }
      });
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_DATA).insert(dataResult.recordset);
      console.log(`[ETL] Loaded ${dataResult.recordset.length} dimension data members.`);
    }

    console.log('[ETL] Pipeline completed successfully!');
    console.log(`[ETL] Triggering cache invalidation for ${TARGET_CLIENT_ID}...`);
    await cacheService.invalidateClientCache(TARGET_CLIENT_ID);

  } catch (error: any) {
    console.error('[ETL] Pipeline failed:', error.message);
    if (error.name === 'PartialFailureError' && error.errors) {
      console.error('[ETL] BQ Error details:', JSON.stringify(error.errors[0], null, 2));
    }
    process.exit(1);
  } finally {
    if (pool) await pool.close();
    // Always clean up the local temp file to prevent disk exhaustion
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
  }
};

if (require.main === module) {
  runAzureToBigQuerySync();
}
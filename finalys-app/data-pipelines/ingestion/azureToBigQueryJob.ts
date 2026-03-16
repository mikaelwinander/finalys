// /data-pipelines/ingestion/azureToBigQueryJob.ts
import 'dotenv/config';
import * as sql from 'mssql';
import { BigQuery } from '@google-cloud/bigquery';

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

// --- Interfaces updated to client_id ---
interface BqFinancialRow {
  client_id: string;
  dataset_id: string;
  period_id: number;
  amount_type_id: string;
  dim01: string | null;
  dim02: string | null;
  dim03: string | null;
  dim04: string | null;
  dim05: string | null;
  dim06: string | null;
  dim07: string | null;
  dim08: string | null;
  dim09: string | null;
  dim10: string | null;
  dim11: string | null;
  dim12: string | null;
  amount: number;
}

interface BqDimMappingRow {
  client_id: string;
  dim_id: string;
  dim_name: string;
  sort_index: number | null;
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

  try {
    pool = await sql.connect(sqlConfig);
    console.log('[ETL] Connected to Azure SQL.');

    // --- STEP 1: SYNC FINANCIAL FACTS ---
    const factsResult = await pool.request()
      .input('clientId', sql.NVarChar, TARGET_CLIENT_ID)
      .query<BqFinancialRow>(`
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
    
    if (factsResult.recordset.length > 0) {
      await bqClient.query({
        query: `DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE_FACTS}\` WHERE client_id = @clientId`,
        params: { clientId: TARGET_CLIENT_ID }
      });
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_FACTS).insert(factsResult.recordset);
      console.log(`[ETL] Loaded ${factsResult.recordset.length} fact rows.`);
    }

    // --- STEP 2: SYNC DIMENSION MAPPING ---
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

    // --- STEP 3: SYNC DIMENSION DATA (Members) ---
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
  } catch (error: any) {
    console.error('[ETL] Pipeline failed:', error.message);
    
    // Unpack BigQuery PartialFailureErrors to see the exact column mismatch
    if (error.name === 'PartialFailureError' && error.errors) {
      console.error('[ETL] First row error details:', JSON.stringify(error.errors[0], null, 2));
    }
    
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
  }
};

if (require.main === module) {
  runAzureToBigQuerySync();
}
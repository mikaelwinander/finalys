// /data-pipelines/ingestion/azureToBigQueryJob.ts
import 'dotenv/config';
import * as sql from 'mssql';
import { BigQuery } from '@google-cloud/bigquery';

// --- Configuration ---
const sqlConfig: sql.config = {
  user: process.env.AZURE_SQL_USER || 'your_db_user',
  password: process.env.AZURE_SQL_PASSWORD || 'your_db_password',
  database: process.env.AZURE_SQL_DATABASE || 'your_database_name',
  server: process.env.AZURE_SQL_SERVER || 'your_server.database.windows.net',
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  options: {
    encrypt: true,
    trustServerCertificate: false 
  }
};

const bqClient = new BigQuery({ projectId: 'snbx-efcpa-effectplan-vcdm' });
const BQ_DATASET = 'finalys_dataset'; 
const BQ_TABLE_FACTS = 'financial_data_view';
const BQ_TABLE_MAPPING = 'dimension_mapping'; // Cleaned up: Only the mapping table remains

const TARGET_CLIENT_ID = process.env.TARGET_CLIENT_ID || 'FIN';

// --- Interfaces aligned with Azure ---
interface BqFinancialRow {
  tenant_id: string;
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
  tenant_id: string;
  dim_id: string;
  dim_name: string;
  position: number;
}

// --- ETL Pipeline ---
export const runAzureToBigQuerySync = async () => {
  console.log(`[ETL] Starting ingestion job for ClientId: ${TARGET_CLIENT_ID}...`);
  let pool: sql.ConnectionPool | undefined;

  try {
    pool = await sql.connect(sqlConfig);
    console.log('[ETL] Connected to Azure SQL.');

    // ==========================================
    // STEP 1: SYNC FINANCIAL FACTS
    // ==========================================
    console.log('[ETL] Step 1: Extracting Financial Facts...');
    const factsResult = await pool.request()
      .input('clientId', sql.NVarChar, TARGET_CLIENT_ID)
      .query<BqFinancialRow>(`
        SELECT 
          pd.ClientId AS tenant_id,
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
    
    const factRows = factsResult.recordset;
    console.log(`[ETL] Extracted ${factRows.length} fact rows.`);

    if (factRows.length > 0) {
      console.log(`[ETL] Clearing old BigQuery facts for tenant ${TARGET_CLIENT_ID}...`);
      await bqClient.query(`DELETE FROM \`${BQ_DATASET}.${BQ_TABLE_FACTS}\` WHERE tenant_id = '${TARGET_CLIENT_ID}'`);

      console.log(`[ETL] Inserting fresh facts into BigQuery...`);
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_FACTS).insert(factRows);
      console.log(`[ETL] Successfully loaded facts.`);
    }

    // ==========================================
    // STEP 2: SYNC DIMENSION MAPPING
    // ==========================================
    console.log('[ETL] Step 2: Extracting Dimension Mapping...');
    const dimsResult = await pool.request()
      .input('clientId', sql.NVarChar, TARGET_CLIENT_ID)
      .query<BqDimMappingRow>(`
        SELECT 
          ClientId AS tenant_id,
          LOWER(DimId) AS dim_id,    -- Converts 'Dim01' to 'dim01' to match the frontend
          DimName AS dim_name,       -- Your exact column name!
          Position AS position       -- Assuming this is called Position
        FROM dbo.xp_view_dim_map
        WHERE ClientId = @clientId
      `);
    
    const dimRows = dimsResult.recordset;
    console.log(`[ETL] Extracted ${dimRows.length} dimension mapping rows.`);

    if (dimRows.length > 0) {
      console.log(`[ETL] Clearing old BigQuery mappings for tenant ${TARGET_CLIENT_ID}...`);
      await bqClient.query(`DELETE FROM \`${BQ_DATASET}.${BQ_TABLE_MAPPING}\` WHERE tenant_id = '${TARGET_CLIENT_ID}'`);

      console.log(`[ETL] Inserting fresh dimension mappings into BigQuery...`);
      await bqClient.dataset(BQ_DATASET).table(BQ_TABLE_MAPPING).insert(dimRows);
      console.log(`[ETL] Successfully loaded dimension mappings.`);
    } else {
      console.log('[ETL] No dimension mappings found to sync.');
    }

    console.log('[ETL] Pipeline completed successfully!');

  } catch (error) {
    console.error('[ETL] Pipeline failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('[ETL] Azure SQL connection closed.');
    }
  }
};

if (require.main === module) {
  runAzureToBigQuerySync();
}
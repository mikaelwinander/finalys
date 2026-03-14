// /data-pipelines/ingestion/azureToBigQueryJob.ts
import * as sql from 'mssql';
import { BigQuery } from '@google-cloud/bigquery';

// --- Domain Interfaces ---

// Represents "Versions" in Azure SQL
interface SqlVersionRow {
  VersionId: number;
  TenantId: string;
  VersionName: string;
  IsActive: boolean;
  CreatedAt: Date;
}

// Represents "Datasets" in BigQuery
interface BqDatasetRow {
  dataset_id: string; // Mapped from VersionId
  tenant_id: string;  // Multi-tenant isolation
  dataset_name: string; // Mapped from VersionName
  is_active: boolean;
  created_at: string; // BigQuery expects specific date formats (ISO string)
}

// --- Configuration ---
const sqlConfig: sql.config = {
  user: process.env.AZURE_SQL_USER || 'your_username',
  password: process.env.AZURE_SQL_PASSWORD || 'your_password',
  database: process.env.AZURE_SQL_DATABASE || 'your_database',
  server: process.env.AZURE_SQL_SERVER || 'your_server.database.windows.net',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false
  }
};

const bqClient = new BigQuery();
const BQ_DATASET = 'analytics_dataset';
const BQ_TABLE = 'datasets'; // Mapped from Versions

// --- ETL Pipeline ---
export const runAzureToBigQuerySync = async () => {
  console.log('[ETL] Starting Azure SQL to BigQuery ingestion job...');

  // Declare the pool variable outside the try block so it can be accessed in finally
  let pool: sql.ConnectionPool | undefined;

  try {
    // 1. Connect to Azure SQL (Source of Truth)
    // Capture the connection pool
    pool = await sql.connect(sqlConfig);
    console.log('[ETL] Connected to Azure SQL.');

    // 2. Extract Data
    // Execute the query using the explicit pool request
    const result = await pool.request().query<SqlVersionRow>(`
      SELECT 
        VersionId, 
        TenantId, 
        VersionName, 
        IsActive, 
        CreatedAt
      FROM dbo.Versions
      WHERE IsActive = 1; 
    `);
    
    const rows = result.recordset;
    console.log(`[ETL] Extracted ${rows.length} rows from Azure SQL.`);

    if (rows.length === 0) {
      console.log('[ETL] No data to sync. Exiting.');
      return;
    }

    // 3. Transform Data
    const bqRows: BqDatasetRow[] = rows.map(row => ({
      dataset_id: row.VersionId.toString(),
      tenant_id: row.TenantId,
      dataset_name: row.VersionName,
      is_active: row.IsActive,
      created_at: row.CreatedAt.toISOString(),
    }));

    // 4. Load Data into BigQuery
    const table = bqClient.dataset(BQ_DATASET).table(BQ_TABLE);
    
    await table.insert(bqRows);
    console.log(`[ETL] Successfully loaded ${bqRows.length} rows into BigQuery (${BQ_DATASET}.${BQ_TABLE}).`);

  } catch (error) {
    console.error('[ETL] Pipeline failed:', error);
    process.exit(1);
  } finally {
    // Clean up connections using the captured pool
    if (pool) {
      await pool.close();
      console.log('[ETL] Azure SQL connection closed.');
    }
  }
};

// Execute the job if run directly
if (require.main === module) {
  runAzureToBigQuerySync();
}
-- /infrastructure/bigquery/tables.sql

-- 1. Fact Table (Financial Data)
CREATE TABLE IF NOT EXISTS `snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_data_view` (
  client_id STRING NOT NULL,
  dataset_id STRING NOT NULL,
  period_id INT64 NOT NULL,
  amount_type_id STRING NOT NULL,
  dim01 STRING,
  dim02 STRING,
  dim03 STRING,
  dim04 STRING,
  dim05 STRING,
  dim06 STRING,
  dim07 STRING,
  dim08 STRING,
  dim09 STRING,
  dim10 STRING,
  dim11 STRING,
  dim12 STRING,
  amount FLOAT64 NOT NULL
)
PARTITION BY _PARTITIONDATE
CLUSTER BY client_id, dataset_id;

-- 2. Dimension Mapping (Column name aliases)
CREATE TABLE IF NOT EXISTS `snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_mapping` (
  client_id STRING NOT NULL,
  dim_id STRING NOT NULL,
  dim_name STRING NOT NULL,
  position INT64 NOT NULL 
)
CLUSTER BY client_id, dim_id;

-- 3. Dimension Data (Member names)
CREATE TABLE IF NOT EXISTS `snbx-efcpa-effectplan-vcdm.finalys_dataset.dimension_data` (
  client_id STRING NOT NULL,
  dim_id STRING NOT NULL,
  dim_data_id STRING NOT NULL,
  dim_data_name STRING NOT NULL,
  sort_index INT64 
)
CLUSTER BY client_id, dim_id, dim_data_id;

-- 4. Financial Adjustments (Simulation Audit Trail & Deltas)
CREATE TABLE IF NOT EXISTS `snbx-efcpa-effectplan-vcdm.finalys_dataset.financial_adjustments` (
  client_id STRING NOT NULL,
  dataset_id STRING NOT NULL,
  user_id STRING NOT NULL,
  shared_flag BOOL DEFAULT FALSE, -- <--- ADDED: Mandatory for multi-client isolation and sharing rules
  period_id INT64,
  dim01 STRING,
  dim02 STRING,
  dim03 STRING,
  dim04 STRING,
  dim05 STRING,
  dim06 STRING,
  dim07 STRING,
  dim08 STRING,
  dim09 STRING,
  dim10 STRING,
  dim11 STRING,
  dim12 STRING,
  adjustment_amount FLOAT64 NOT NULL,
  comment STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(created_at)
CLUSTER BY client_id, dataset_id, user_id; -- <--- UPDATED: Added user_id for optimal partition pruning
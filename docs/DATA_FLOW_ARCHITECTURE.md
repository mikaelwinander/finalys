DATA FLOW ARCHITECTURE

Overview

The architecture separates responsibilities between the frontend, an API layer, caching, analytics processing, and the operational database. This separation ensures security, scalability, and predictable performance when working with very large datasets.

High-level architecture

Frontend (React)
      │
      ▼
API Layer (Cloud Run / Cloud Functions)
      │
 ┌────┼───────────────┐
 ▼    ▼               ▼
Redis Cache      BigQuery       Azure SQL
(Memorystore)   (analytics)   (source of truth)

Ingestion path for analytical workloads:

Azure SQL
   │
   ▼
ETL / ingestion job
   │
   ▼
BigQuery


STEP-BY-STEP DATA FLOW

Step 1 — User interacts with the UI

The React frontend sends a request to the backend API.

Example request:

GET /api/pivot-data

Typical parameters:

datasetId
dimensions
measures
filters

The frontend never queries BigQuery or Azure SQL directly.


Step 2 — Authentication verification

The request contains an authentication token issued by Google Cloud Identity Platform.

The API layer performs:

1. Token validation
2. Extraction of identity information such as

user_id
tenant_id
roles

This information is required to enforce tenant isolation and access rules.


Step 3 — Cache check

Before querying analytical systems, the API checks the cache in Memorystore (Redis).

Example cache key:

pivot:{tenant}:{dataset}:{filtersHash}

If the result exists in Redis:

Redis → result is returned in milliseconds.


Step 4 — Query BigQuery if cache miss

If the cache does not contain the requested data, the API executes a query in BigQuery.

Example analytical query:

SELECT
  dimension1,
  dimension2,
  SUM(amount)
FROM dataset.financial_data
WHERE tenant_id = @tenantId
GROUP BY dimension1, dimension2

Important rules:

- Parameterized queries must be used.
- tenant_id filtering must always be included.
- Aggregations must run in BigQuery.

The result is a summarized dataset rather than millions of raw rows.


Step 5 — Cache the result

The API stores the query result in Redis for future requests.

Example:

SET cacheKey result TTL=5 minutes

Subsequent requests can then be served instantly.


Step 6 — Return result to frontend

The API sends a summarized response back to the frontend.

Example response:

{
  rows: [
    { dim1: "A", dim2: "2025", amount: 12345 }
  ]
}

The React application then renders the pivot table view.


WHY THE API LAYER IS NECESSARY

Allowing the frontend to directly access BigQuery or databases introduces major risks.

Key problems without an API layer:

Security
Database credentials cannot safely exist in browser code.

Multi-tenant isolation
Users could bypass tenant filters.

Query validation
Users could execute expensive or unsafe queries.

Caching
No centralized caching would exist.

Business logic
Rules would be duplicated across clients.

Cost control
BigQuery costs could increase rapidly.


RESPONSIBILITIES OF THE API LAYER

The API layer acts as the control center of the SaaS system.

Its responsibilities include:

Authentication verification
Validate Identity Platform tokens.

Tenant enforcement
Ensure tenant_id and user_id filters are applied.

Query construction
Build safe BigQuery queries.

Caching
Read/write results to Redis.

Cost protection
Restrict query complexity.

Data transformation
Convert raw results into UI-ready responses.

Security
Prevent SQL injection and unauthorized access.


WHY CLOUD RUN IS A GOOD CHOICE

Cloud Run is recommended for implementing the API layer.

Advantages:

- Fully managed serverless platform
- Automatic scaling
- Supports Node.js, Python, Go, etc.
- Works well with BigQuery clients
- Easy connection to Redis
- Easy authentication verification

Typical latency profile:

Cloud Run request: 20–80 ms
Redis read: <1 ms
BigQuery query: 0.5–3 seconds


EXAMPLE REQUEST LIFECYCLE

User clicks pivot view
        │
        ▼
React sends API request
        │
        ▼
Cloud Run API receives request
        │
        ▼
Verify Identity Platform token
        │
        ▼
Check Redis cache
   │         │
   │ hit     │ miss
   ▼         ▼
Return      Query BigQuery
result          │
                ▼
           Cache result
                │
                ▼
         Return response to UI


AZURE SQL ACCESS

Azure SQL Database remains the operational source of truth.

Typical usage:

- Source data for analytics pipelines
- Metadata lookups
- ETL ingestion into BigQuery

Large analytical queries should always run in BigQuery rather than directly against Azure SQL.


MENTAL MODEL OF THE SYSTEM

Frontend
User interface.

API Layer
Traffic controller and security boundary.

Redis
Ultra-fast cache for frequently requested queries.

BigQuery
Analytics engine handling large-scale aggregation.

Azure SQL
Operational source database.


CONCLUSION

The API layer is essential.

It provides:

- security
- multi-tenant enforcement
- caching
- cost control
- business logic
- query optimization

Without the API layer, the SaaS system would be difficult to secure, expensive to operate, and harder to scale.
PROJECT STRUCTURE (FINALYS Architecture)

This structure separates the system into three main parts:

1. Frontend (React application)
2. Backend API layer (Cloud Run service)
3. Infrastructure / data pipeline components

The goal is to keep analytics logic, authentication, caching, and UI concerns clearly separated.


ROOT PROJECT STRUCTURE

/finalys-app
│
├── frontend
├── api
├── data-pipelines
├── infrastructure
└── docs



FRONTEND STRUCTURE (React + TypeScript + Vite)

/frontend
│
├── src
│   │
│   ├── components
│   │   ├── PivotTable
│   │   │   ├── PivotTable.tsx
│   │   │   ├── PivotCell.tsx
│   │   │   └── PivotHeader.tsx
│   │   │
│   │   ├── Layout
│   │   │   ├── AppLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   └── common
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── Spinner.tsx
│   │
│   ├── hooks
│   │   ├── usePivotData.ts
│   │   ├── useDatasets.ts
│   │   └── useAuth.ts
│   │
│   ├── services
│   │   ├── apiClient.ts
│   │   ├── datasetService.ts
│   │   └── pivotService.ts
│   │
│   ├── types
│   │   ├── dataset.types.ts
│   │   ├── pivot.types.ts
│   │   └── user.types.ts
│   │
│   ├── pages
│   │   ├── DashboardPage.tsx
│   │   ├── DatasetPage.tsx
│   │   └── SimulationPage.tsx
│   │
│   ├── config
│   │   └── environment.ts
│   │
│   └── main.tsx
│
└── index.html



API LAYER STRUCTURE (Cloud Run Backend)

The API layer handles:

- authentication verification
- Redis caching
- BigQuery query execution
- Azure SQL access
- simulation storage
- pivot aggregation requests


/api
│
├── src
│   │
│   ├── server.ts
│   │
│   ├── config
│   │   ├── bigqueryClient.ts
│   │   ├── redisClient.ts
│   │   ├── azureSqlClient.ts
│   │   └── identityConfig.ts
│   │
│   ├── middleware
│   │   ├── authMiddleware.ts
│   │   ├── tenantMiddleware.ts
│   │   └── errorHandler.ts
│   │
│   ├── routes
│   │   ├── pivotRoutes.ts
│   │   ├── datasetRoutes.ts
│   │   └── simulationRoutes.ts
│   │
│   ├── controllers
│   │   ├── pivotController.ts
│   │   ├── datasetController.ts
│   │   └── simulationController.ts
│   │
│   ├── services
│   │   ├── bigqueryService.ts
│   │   ├── cacheService.ts
│   │   ├── datasetService.ts
│   │   └── simulationService.ts
│   │
│   ├── repositories
│   │   ├── bigqueryRepository.ts
│   │   └── azureSqlRepository.ts
│   │
│   ├── queries
│   │   ├── pivotQueries.ts
│   │   ├── datasetQueries.ts
│   │   └── simulationQueries.ts
│   │
│   ├── types
│   │   ├── api.types.ts
│   │   ├── pivot.types.ts
│   │   └── simulation.types.ts
│   │
│   └── utils
│       ├── cacheKeyBuilder.ts
│       ├── sqlBuilder.ts
│       └── logger.ts
│
├── Dockerfile
└── package.json



DATA PIPELINE STRUCTURE

These scripts move operational data from Azure SQL into BigQuery.


/data-pipelines
│
├── ingestion
│   ├── azureToBigQueryJob.ts
│   └── scheduleConfig.ts
│
├── transformations
│   ├── datasetTransform.ts
│   └── simulationTransform.ts
│
└── schemas
    ├── bigquerySchemas.ts
    └── tableDefinitions.sql



INFRASTRUCTURE STRUCTURE

Infrastructure configuration and deployment.


/infrastructure
│
├── cloud-run
│   └── service.yaml
│
├── redis
│   └── memorystore-config.yaml
│
├── bigquery
│   ├── datasets.sql
│   └── tables.sql
│
└── identity
    └── identity-platform-config.yaml



CACHE KEY STRATEGY

Redis cache keys should follow a deterministic structure.

Example:

pivot:{tenantId}:{datasetId}:{dimensionHash}:{filterHash}

Example:

pivot:tenantA:dataset1:dimHash123:filterHash456



WHY THIS STRUCTURE WORKS

Frontend
Keeps UI logic separate from analytics processing.

API Layer
Centralizes authentication, caching, and query execution.

Repositories
Isolate database logic.

Services
Contain business logic.

Controllers
Handle HTTP requests.

Pipelines
Handle data ingestion and transformation.

Infrastructure
Keeps deployment configuration organized.


This structure scales well as the SaaS application grows and keeps responsibilities clearly separated across the system.
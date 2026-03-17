PROJECT FILE STRUCTURE

/api
├── src
│   ├── config
│   │   ├── azureSqlClient.ts       - Initializes connection to the operational source of truth.
│   │   ├── bigqueryClient.ts       - Initializes connection to the analytics engine.
│   │   ├── identityConfig.ts       - Configuration for Google Cloud Identity Platform verification.
│   │   └── redisClient.ts          - Initializes connection to Memorystore for low-latency caching.
│   ├── controllers
│   │   ├── datasetController.ts    - Handles HTTP requests related to datasets.
│   │   ├── pivotController.ts      - Handles pivot aggregation requests.
│   │   └── simulationController.ts - Handles user simulations and adjusted datasets.
│   ├── middleware
│   │   ├── authMiddleware.ts       - Validates Identity Platform tokens.
│   │   ├── errorHandler.ts         - Centralized error handling.
│   │   └── tenantMiddleware.ts     - Enforces tenant isolation rules.
│   ├── repositories
│   │   └── bigqueryRepository.ts   - Executes BigQuery operations and queries.
│   ├── routes
│   │   ├── datasetRoutes.ts        - Endpoints for dataset retrieval.
│   │   ├── pivotRoutes.ts          - Endpoints for analytical pivot data.
│   │   └── simulationRoutes.ts     - Endpoints for simulation workloads.
│   ├── services
│   │   ├── aiService.ts            - Business logic for AI-powered features.
│   │   ├── bigqueryService.ts      - Business logic wrapping BigQuery interactions.
│   │   ├── cacheService.ts         - Handles reading and writing results to Redis.
│   │   ├── simulationService.ts    - Business logic for processing simulations.
│   │   └── templateService.ts      - Logic for managing template structures.
│   ├── types
│   │   └── api.types.ts            - API-specific TS interfaces.
│   ├── utils
│   │   ├── cacheKeyBuilder.ts      - Generates deterministic Redis cache keys.
│   │   ├── clearCache.ts           - Utility for invalidating cache.
│   │   ├── logger.ts               - Application logging.
│   │   └── sqlBuilder.ts           - Safely constructs parameterized queries.
│   └── server.ts                   - Main entry point for the API backend.
├── package-lock.json
├── package.json
└── tsconfig.json

/frontend
├── .vscode
├── dist
├── node_modules
├── src
│   ├── assets
│   │   └── logo.svg                - Application logo graphic.
│   ├── components
│   │   ├── analytics
│   │   │   ├── AdjustmentPopover.tsx
│   │   │   └── SimulationHistoryPanel.tsx
│   │   ├── common
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Spinner.tsx
│   │   ├── Layout
│   │   │   ├── AppLayout.tsx
│   │   │   └── Sidebar.tsx
│   │   └── PivotTable
│   │       ├── AdminTemplatePopover.tsx
│   │       ├── DraggableCard.tsx
│   │       ├── PivotDropZones.tsx
│   │       ├── PivotSettingsModal.tsx
│   │       └── PivotTable.tsx
│   ├── config
│   │   └── environment.ts          - Frontend environment variables.
│   ├── hooks
│   │   ├── useAuth.ts              - Hook managing user authentication state.
│   │   ├── useDimensionMapping.ts  - Hook for dimension data mapping.
│   │   ├── usePivotData.ts         - Hook executing analytical queries against the API.
│   │   └── usePivotDragDrop.ts     - Hook managing drag-and-drop state for the pivot UI.
│   ├── pages
│   │   └── DashboardPage.tsx       - Main analytical dashboard view.
│   ├── services
│   │   ├── pivotService.ts         - Communication service for pivot endpoints.
│   │   └── simulationService.ts    - Communication service for simulation endpoints.
│   ├── types
│   │   ├── pivot.types.ts          - TypeScript interfaces for pivot models.
│   │   └── user.types.ts           - TypeScript interfaces for user models.
│   ├── utils
│   │   └── pivotMatrixUtil.ts      - Helper utility for complex matrix transformations.
│   ├── App.tsx                     - Root component.
│   ├── index.css                   - Global stylesheet.
│   ├── main.tsx                    - React application entry point.
│   └── vite-env.d.ts               - Vite type declarations.
├── eslint.config.js
├── index.html                      - HTML entry point.
├── package-lock.json
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts                  - Vite bundler configuration.
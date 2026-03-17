PROJECT FOLDER STRUCTURE

/api                    - The Cloud Run backend acting as the control center and security boundary.
├── src
│   ├── config          - Configuration files and client initializations for external services.
│   ├── controllers     - Route handlers that process incoming HTTP requests.
│   ├── middleware      - Express middleware functions for request interception, such as auth and tenant rules.
│   ├── repositories    - Isolates database logic and direct data access.
│   ├── routes          - Defines API endpoints and connects them to controllers.
│   ├── services        - Contains the core business logic.
│   ├── types           - Backend-specific TypeScript interfaces.
│   └── utils           - Shared utility functions used across the API layer.

/frontend               - The React application strictly responsible for UI logic.
├── src
│   ├── assets          - Static files and visuals.
│   ├── components      - Reusable UI components categorized by domain.
│   │   ├── analytics   - Components for financial adjustments and simulation history.
│   │   ├── common      - Generic UI elements like buttons and modals.
│   │   ├── Layout      - Structural components for the application shell.
│   │   └── PivotTable  - Core UI components for the interactive financial views.
│   ├── config          - Environment configurations.
│   ├── hooks           - Custom React hooks for analytical queries and state management.
│   ├── pages           - Top-level page components representing primary routes.
│   ├── services        - API communication layer interacting with the backend.
│   ├── types           - Global TypeScript domain models and interfaces.
│   └── utils           - Helper scripts and utility functions.
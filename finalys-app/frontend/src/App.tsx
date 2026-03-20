// /frontend/src/App.tsx
import { type FC } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layout & Pages
import AppLayout from './components/Layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DimensionsPage } from './pages/DimensionsPage';
import { SettingsPage } from './pages/SettingsPage';

// 1. Define the Data Router configuration array
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "datasets", element: <DatasetsPage /> },
      { path: "dimensions", element: <DimensionsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <Navigate to="/dashboard" replace /> }
    ]
  }
]);

const App: FC = () => {
  return (
    <AuthProvider>
      {/* 2. Swap BrowserRouter for the new RouterProvider */}
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;
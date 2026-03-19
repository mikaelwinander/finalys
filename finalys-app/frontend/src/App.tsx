// /frontend/src/App.tsx
import { type FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layout & Pages
import AppLayout from './components/Layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import { DatasetsPage } from './pages/DatasetsPage';
import { DimensionsPage } from './pages/DimensionsPage';
import { SettingsPage } from './pages/SettingsPage';

const App: FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All routes live inside the AppLayout shell */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            
            {/* 2. Swap out the Placeholders for the real components */}
            <Route path="datasets" element={<DatasetsPage />} />
            <Route path="dimensions" element={<DimensionsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            
            {/* Note: I changed the fallback from /home to /dashboard since /home doesn't exist */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
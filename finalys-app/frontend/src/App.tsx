// /frontend/src/App.tsx
import { type FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layout & Pages
import AppLayout from './components/Layout/AppLayout';
import DashboardPage from './pages/DashboardPage';

// Placeholder pages to prevent routing errors
const PlaceholderPage: FC<{ title: string }> = ({ title }) => (
  <div className="p-4"><h1 className="text-2xl font-bold">{title}</h1></div>
);

const App: FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* All routes live inside the AppLayout shell */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="datasets" element={<PlaceholderPage title="Datasets (Versions)" />} />
            <Route path="simulations" element={<PlaceholderPage title="Simulations" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
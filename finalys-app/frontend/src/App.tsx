// /frontend/src/App.tsx
import type { FC } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';

// Layout Components
// import AppLayout from './components/Layout/AppLayout';

// Pages
// import DashboardPage from './pages/DashboardPage';

const App: FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            SaaS Analytics System
          </h1>
          <p className="mt-2 text-primary">
            Authentication context initialized.
          </p>
        </div>
        {/* Your routes will go here once the layout is built */}
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
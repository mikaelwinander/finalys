// /frontend/src/components/Layout/AppLayout.tsx
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

const AppLayout: FC = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative overflow-y-auto">
        {/* Optional: Top Header Bar could go here */}
        <header className="h-16 bg-surface/50 backdrop-blur-sm border-b border-border flex items-center px-8 sticky top-0 z-10">
          <h1 className="text-sm font-medium text-surface-foreground/80">SaaS Analytics Workspace</h1>
        </header>
        
        {/* Dynamic Page Content */}
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
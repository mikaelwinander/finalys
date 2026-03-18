// /frontend/src/components/Layout/AppLayout.tsx
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const AppLayout: FC = () => {
  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      {/* Top Header Bar spans full width */}
      <Header />
      
      {/* Bottom Content Area: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Fixed Sidebar below Header */}
        <Sidebar />
        
        {/* Dynamic Page Content */}
        <main className="flex-1 p-8 overflow-y-auto relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
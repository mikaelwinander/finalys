// /frontend/src/components/Layout/AppLayout.tsx
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const AppLayout: FC = () => {
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground">
      {/* Left Pillar: Sidebar Navigation
        It handles its own width transitions internally. 
      */}
      <Sidebar />

      {/* Right Pillar: Main Application Area
        Uses flex-1 to fill remaining space and min-w-0 to prevent flexbox blowout. 
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navigation */}
        <Header />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {/* Removed 'mx-auto' so it aligns left instead of centering on large screens */}
          <div className="max-w-[1600px] h-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default AppLayout;
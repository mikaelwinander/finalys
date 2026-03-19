// /frontend/src/components/Layout/AppLayout.tsx
import { useState } from 'react';
import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const AppLayout: FC = () => {
  // Lift the sidebar state up so both the Header and Sidebar can react to it
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Handler to toggle the state (you'll pass this to the Sidebar's toggle button)
  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Pass the state to the Header so it can adjust its internal widths */}
      <Header isSidebarCollapsed={isSidebarCollapsed} />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        
        {/* Pass the state and toggle function to the Sidebar */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />

        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-[1600px] h-full">
            <Outlet />
          </div>
        </main>
        
      </div>
    </div>
  );
};

export default AppLayout;
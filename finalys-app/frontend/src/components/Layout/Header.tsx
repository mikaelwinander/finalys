// /frontend/src/components/Layout/Header.tsx
import type { FC } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Popover } from '../common/Popover';
import logoPng from '../../assets/AI-powered financial logo designs.png';


interface HeaderProps {
  isSidebarCollapsed: boolean;
}

export const Header: FC<HeaderProps> = ({ isSidebarCollapsed }) => {
  const userMenuContent = (
    <div className="flex flex-col space-y-1">
      <div className="px-3 py-2 border-b border-border mb-1">
        <p className="text-sm font-semibold text-foreground">Planner User</p>
        <p className="text-xs text-foreground opacity-60">planner@finalys.com</p>
      </div>
      
      <Button variant="ghost" className="w-full justify-start h-9 px-3 text-interactive hover:text-interactive-hover hover:bg-interactive-muted">
        <Icon name="profile" size={16} className="mr-2" />
        Profile
      </Button>
      <Button variant="ghost" className="w-full justify-start h-9 px-3 text-interactive hover:text-interactive-hover hover:bg-interactive-muted">
        <Icon name="settings" size={16} className="mr-2" />
        Settings
      </Button>
      <Button variant="ghost" className="w-full justify-start h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 mt-2 border-t border-border pt-1">
        <Icon name="logout" size={16} className="mr-2" />
        Log out
      </Button>
    </div>
  );

  // Dynamic width class based on sidebar state (matches standard Tailwind sizes)
  const leftSectionWidth = isSidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <header className="flex items-center w-full h-16 bg-muted border-b border-border z-20 shrink-0">
      
      {/* 1. Left Section: Dynamically adjusts width with a smooth transition */}
      <div className={`flex items-center justify-center h-full border-r border-border shrink-0 transition-all duration-300 ease-in-out ${leftSectionWidth}`}>
        <img 
          src={logoPng} 
          alt="Finalys Logo" 
          className="w-20 h-20 object-contain px-1" 
        />
      </div>

      {/* 2. Middle Section: Shifts horizontally as the left section resizes */}
      <div className="flex flex-1 items-end gap-3 px-6 transition-all duration-300 ease-in-out">
        <h1 className="text-4xl font-bold text-primary leading-none uppercase tracking-tight">
          FINALYS
        </h1>
        <span className="text-2xl font-medium text-foreground opacity-60 leading-none mb-[1px]">
          - AI powered financial analysis and simulation
        </span>
      </div>

      {/* 3. Right Section: Remains pinned */}
      <div className="flex items-center px-6 shrink-0 gap-2 text-sm font-medium">
        <Popover 
          align="right"
          trigger={
            <Button 
              variant="outline"
              className="w-10 h-10 rounded-full p-0 flex items-center justify-center shadow-sm"
              aria-label="User profile"
            >
              <Icon name="user" size={20} />
            </Button>
          }
          content={userMenuContent}
        />
      </div>

    </header>
  );
};
// /frontend/src/components/Layout/Header.tsx
import type { FC } from 'react';
import { Icon } from '../common/Icon';
import { Button } from '../common/Button';
import { Popover } from '../common/Popover';

export const Header: FC = () => {
  // Define the menu content adhering to Interactive Nuance standards
  const userMenuContent = (
    <div className="flex flex-col space-y-1">
      <div className="px-3 py-2 border-b border-border mb-1">
        <p className="text-sm font-semibold text-foreground">Planner User</p>
        <p className="text-xs text-foreground opacity-60">planner@finalys.com</p>
      </div>
      
      <Button variant="ghost" className="w-full justify-start h-9 px-3">
        <Icon name="profile" size={16} className="mr-2" />
        Profile
      </Button>
      <Button variant="ghost" className="w-full justify-start h-9 px-3">
        <Icon name="settings" size={16} className="mr-2" />
        Settings
      </Button>
      <Button variant="ghost" className="w-full justify-start h-9 px-3 text-destructive hover:text-destructive hover:bg-destructive/10 mt-2 border-t border-border pt-1">
        <Icon name="logout" size={16} className="mr-2" />
        Log out
      </Button>
    </div>
  );

  return (
    <header className="h-16 bg-muted border-b border-border flex items-center px-6 shrink-0 justify-between z-20">
      
      <div className="flex items-end gap-3">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-lg font-bold shrink-0 mb-[4px]">
          F
        </div>
        <h1 className="text-4xl font-bold text-primary leading-none uppercase tracking-tight">
          FINALYS
        </h1>
        <span className="text-2xl font-medium text-foreground opacity-60 leading-none mb-[1px]">
          - AI powered financial analysis and simulation
        </span>
      </div>

      {/* Wrapping the interactive Button in our new Popover */}
      <div className="flex items-center gap-2 text-sm font-medium">
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
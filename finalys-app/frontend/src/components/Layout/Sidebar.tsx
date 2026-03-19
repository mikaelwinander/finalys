// /frontend/src/components/Layout/Sidebar.tsx
import { useState } from 'react';
import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../common/Icon';
import { Button } from '../common/Button';

interface NavItem {
  name: string;
  path: string;
  icon: IconName;
}

export const Sidebar: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Datasets', path: '/datasets', icon: 'dataset' },
    { name: 'Dimensions', path: '/dimensions', icon: 'dimensions' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside 
      className={`bg-surface border-r border-border h-full flex flex-col transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top spacing applied directly to the nav to maintain consistent gap whether collapsed or not */}
      <nav className="flex-1 px-3 pt-8 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center rounded-md transition-all duration-200
              /* Increased height for better target area and visibility */
              h-12 px-4 
              ${isCollapsed ? 'justify-center' : 'justify-start'}
              
              /* Interactive Nuance: Enforcing the blue-tinted theme tokens */
              ${isActive 
                ? 'bg-interactive-muted text-interactive font-semibold ring-1 ring-interactive/20' 
                : 'text-interactive hover:bg-interactive-muted hover:text-interactive-hover'}
            `}
          >
            <Icon 
              name={item.icon} 
              size={22} 
              className="shrink-0" 
            />
            
            {!isCollapsed && (
              <span className="ml-3 truncate text-2xl font-medium">
                {item.name}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle using Centralized Button Primitive */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full justify-center text-interactive hover:bg-interactive-muted"
        >
          <Icon 
            name={isCollapsed ? 'chevronRight' : 'chevronLeft'} 
            size={20} 
          />
          {!isCollapsed && <span className="ml-2 text-sm">Collapse View</span>}
        </Button>
      </div>
    </aside>
  );
};
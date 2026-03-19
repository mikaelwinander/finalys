// /frontend/src/components/Layout/Sidebar.tsx
import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../common/Icon';
import { Button } from '../common/Button';

// 1. Strictly type the props we are passing down from AppLayout
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  name: string;
  path: string;
  icon: IconName;
}

// 2. Accept the props and remove internal useState
export const Sidebar: FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const navItems: NavItem[] = [
    { name: 'Dashboard', path: '/', icon: 'dashboard' },
    { name: 'Datasets', path: '/datasets', icon: 'dataset' },
    { name: 'Dimensions', path: '/dimensions', icon: 'dimensions' },
    { name: 'Settings', path: '/settings', icon: 'settings' },
  ];

  return (
    <aside 
      className={`bg-surface border-r border-border h-full flex flex-col transition-all duration-300 shrink-0 ${
        // 3. Synchronized widths: w-16 matches the collapsed left section of the Header
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="flex-1 px-3 pt-6 space-y-2 overflow-hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              flex items-center rounded-md transition-all duration-200
              h-12 px-4 
              ${isCollapsed ? 'justify-center px-0' : 'justify-start'}
              
              /* Interactive Nuance: Enforcing the blue-tinted theme tokens */
              ${isActive 
                ? 'bg-interactive-muted text-interactive font-semibold ring-1 ring-interactive/20' 
                : 'text-interactive hover:bg-interactive-muted hover:text-interactive-hover'}
            `}
            title={isCollapsed ? item.name : undefined} // Shows a native tooltip when collapsed
          >
            <Icon 
              name={item.icon} 
              size={22} 
              className="shrink-0" 
            />
            
            {/* Smoothly hide text when collapsed */}
            <span 
              className={`ml-3 truncate text-2xl font-medium transition-all duration-300 ${
                isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'
              }`}
            >
              {item.name}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        {/* 4. Trigger the parent's toggle function */}
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full justify-center text-interactive hover:bg-interactive-muted"
        >
          <Icon 
            name={isCollapsed ? 'chevronRight' : 'chevronLeft'} 
            size={20} 
            className="shrink-0"
          />
          <span 
            className={`ml-2 text-sm transition-all duration-300 ${
              isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100 w-auto'
            }`}
          >
            Collapse View
          </span>
        </Button>
      </div>
    </aside>
  );
};
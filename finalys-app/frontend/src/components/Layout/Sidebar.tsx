// /frontend/src/components/Layout/Sidebar.tsx
import { useState } from 'react';
import type { FC } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../common/Icon'; // Adhering to centralized Icon rule

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
    <aside className={`bg-surface border-r border-border h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <nav className="flex-1 px-3 py-6 space-y-1">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex items-center rounded-md transition-all duration-200
            
            /* FIX 1: Set a consistent height and horizontal padding */
            h-11 px-3 
            
            /* FIX 2: Only change justification, not vertical padding */
            ${isCollapsed ? 'justify-center' : 'justify-start'}
            
            ${isActive 
              ? 'bg-primary/10 text-primary' 
              : 'text-foreground/70 bg-transparent'}
            
            hover:bg-muted 
          `}
        >
          {/* FIX 3: Keep icon size consistent or ensure it fits within h-11 */}
          <Icon 
            name={item.icon} 
            size={24} 
            className="shrink-0" 
          />
          
          {!isCollapsed && (
            <span className="ml-3 truncate text-xl font-medium tracking-tight">
              {item.name}
            </span>
          )}
        </NavLink>
      ))}
      </nav>

      {/* Collapse Toggle with hover/active states */}
      <div className="h-14 flex items-center justify-end px-4 border-t border-border">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md text-foreground/50 hover:bg-muted hover:text-foreground active:bg-border transition-colors"
        >
          <Icon name={isCollapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
        </button>
      </div>
    </aside>
  );
};
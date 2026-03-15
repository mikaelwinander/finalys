// /frontend/src/components/Layout/Sidebar.tsx
import type { FC } from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Datasets', path: '/datasets' },
    { name: 'Simulations', path: '/simulations' },
  ];

  return (
    <aside className="w-64 bg-surface border-r border-border h-full flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h2 className="text-xl font-bold text-primary tracking-tight">Finalys</h2>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-md transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-surface-foreground/80 hover:bg-background hover:text-foreground'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border text-xs text-surface-foreground/60 text-center">
        Tenant: Demo Environment
      </div>
    </aside>
  );
};
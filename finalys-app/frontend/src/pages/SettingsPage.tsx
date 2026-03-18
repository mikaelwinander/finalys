import type { FC } from 'react';

export const SettingsPage: FC = () => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-primary mb-4">Settings</h2>
      <p className="text-surface-foreground/80">Application and tenant configuration.</p>
    </div>
  );
};
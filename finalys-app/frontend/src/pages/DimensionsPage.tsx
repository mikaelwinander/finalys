import type { FC } from 'react';

export const DimensionsPage: FC = () => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-primary mb-4">Dimensions</h2>
      <p className="text-surface-foreground/80">Configure your dimension mappings here.</p>
    </div>
  );
};
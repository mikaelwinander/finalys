import type { FC } from 'react';

export const DatasetsPage: FC = () => {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-3xl font-bold text-primary mb-4">Datasets</h2>
      <p className="text-surface-foreground/80">Manage your ingested operational data here.</p>
    </div>
  );
};
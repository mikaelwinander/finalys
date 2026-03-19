// /frontend/src/pages/DatasetsPage.tsx
import type { FC } from 'react';
import { PageContainer } from '../components/Layout/PageContainer';
import { Icon } from '../components/common/Icon';

export const DatasetsPage: FC = () => {
  return (
    <PageContainer 
      title="Dataset Management" 
      description="View and manage ingested operational plans and simulation datasets."
    >
      <div className="flex flex-col items-center justify-center h-64 p-8 rounded-lg border border-dashed border-border bg-surface/50 text-center mt-6">
        <div className="w-12 h-12 mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Icon name="dataset" size={24} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">No Datasets Selected</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          A grid displaying synchronized plan data from Azure SQL and processed simulations from BigQuery will appear here.
        </p>
      </div>
    </PageContainer>
  );
};
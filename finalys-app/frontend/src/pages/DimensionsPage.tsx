// /frontend/src/pages/DimensionsPage.tsx
import type { FC } from 'react';
import { PageContainer } from '../components/Layout/PageContainer';
import { Icon } from '../components/common/Icon';

export const DimensionsPage: FC = () => {
  return (
    <PageContainer 
      title="Dimension Mapping" 
      description="Configure hierarchical structures and map financial dimensions."
    >
      <div className="flex flex-col items-center justify-center h-64 p-8 rounded-lg border border-dashed border-border bg-surface/50 text-center mt-6">
        <div className="w-12 h-12 mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Icon name="dimensions" size={24} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Dimension Setup</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          An interface to manage and re-map dimensions (e.g., Cost Centers, Time Periods) synchronized from the operational database.
        </p>
      </div>
    </PageContainer>
  );
};
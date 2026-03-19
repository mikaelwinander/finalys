// Example: /frontend/src/pages/SettingsPage.tsx
import type { FC } from 'react';
import { PageContainer } from '../components/Layout/PageContainer';
import { Icon } from '../components/common/Icon';

export const SettingsPage: FC = () => {
  return (
    <PageContainer 
      title="Workspace Settings" 
      description="Manage tenant configuration, value formatting, and application preferences."
    >
      <div className="flex flex-col items-center justify-center h-64 p-8 rounded-lg border border-dashed border-border bg-surface/50 text-center mt-6">
        <div className="w-12 h-12 mb-4 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
          <Icon name="settings" size={24} />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">Configuration Overview</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          Global settings including decimal presentation, thousands separators, and caching policies will be managed here.
        </p>
      </div>
    </PageContainer>
  );
};
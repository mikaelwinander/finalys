// /frontend/src/pages/DashboardPage.tsx
import { type FC, useState } from 'react';
import { usePivotData } from '../hooks/usePivotData';
import { PivotTable } from '../components/PivotTable/PivotTable';

const DashboardPage: FC = () => {
  // Hardcoded for demonstration. In a real app, these would be controlled by dropdowns.
  const [datasetId] = useState('version_1');
  const [dimensions] = useState(['dimension_account', 'dimension_region']);
  const [measures] = useState(['amount']);

  // Fetch data via the API layer
  const { data, isLoading, error, refetch } = usePivotData({
    datasetId,
    dimensions,
    measures,
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Financial Overview</h1>
          <p className="text-surface-foreground/60 mt-1">
            Analyzing dataset: <span className="font-mono text-xs bg-surface px-1 py-0.5 rounded">{datasetId}</span>
          </p>
        </div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Refresh Data
        </button>
      </div>

      {/* Render the core visual component */}
      <PivotTable 
        data={data}
        dimensions={dimensions}
        measures={measures}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};

export default DashboardPage;
// /frontend/src/components/PivotTable/PivotTable.tsx
import React from 'react';
import { PivotRow } from '../../types/pivot.types';

export interface PivotTableProps {
  data: PivotRow[];
  dimensions: string[];
  measures: string[];
  isLoading: boolean;
  error: string | null;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  data,
  dimensions,
  measures,
  isLoading,
  error,
}) => {
  // 1. Handle Error State
  if (error) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
        <h3 className="font-semibold">Failed to load analytics data</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // 2. Handle Loading State
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border rounded-md shadow-sm">
        <div className="text-primary animate-pulse font-medium">
          Aggregating data in BigQuery...
        </div>
      </div>
    );
  }

  // 3. Handle Empty State
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border rounded-md shadow-sm text-surface-foreground/60">
        No data matches the current filters and dimensions.
      </div>
    );
  }

  // 4. Render the Pivot Table
  // The columns consist of all selected dimensions followed by all selected measures
  const columns = [...dimensions, ...measures];

  return (
    <div className="w-full overflow-x-auto bg-surface border border-border rounded-md shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-background border-b border-border">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap capitalize"
              >
                {/* In a production app, you would map internal names like "dimension_account" 
                  to readable names using your Domain Dictionary 
                */}
                {col.replace('dimension_', '').replace('_', ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className="hover:bg-background/50 transition-colors"
            >
              {columns.map((col) => {
                const cellValue = row[col];
                
                // Format measures as numbers (e.g., currency), and dimensions as strings
                const isMeasure = measures.includes(col);
                const displayValue = isMeasure && typeof cellValue === 'number'
                  ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(cellValue)
                  : cellValue;

                return (
                  <td
                    key={`${rowIndex}-${col}`}
                    className={`px-4 py-2 whitespace-nowrap text-surface-foreground ${
                      isMeasure ? 'text-right font-mono' : 'text-left'
                    }`}
                  >
                    {displayValue ?? '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
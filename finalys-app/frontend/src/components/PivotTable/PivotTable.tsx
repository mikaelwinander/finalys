// /frontend/src/components/PivotTable/PivotTable.tsx
import React, { useMemo } from 'react';
import type { PivotRow } from '../../types/pivot.types';

export interface PivotTableProps {
  data: PivotRow[];
  dimensions?: string[]; // Kept for backwards compatibility 
  rowDimensions: string[]; // NEW
  colDimensions: string[]; // NEW
  measures: string[];
  isLoading: boolean;
  error: string | null;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  data,
  rowDimensions,
  colDimensions,
  measures,
  isLoading,
  error,
}) => {

  // --- MATRIX CALCULATION LOGIC ---
  // Memoized so it only recalculates when the data or dimensions actually change
  const { rowHeaders, colHeaders, dataMatrix } = useMemo(() => {
    if (!data || data.length === 0) {
      return { rowHeaders: [], colHeaders: [], dataMatrix: {} };
    }

    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};
    
    // Default to the first measure (usually 'amount')
    const measureKey = measures[0] || 'amount';

    data.forEach(row => {
      // 1. Generate compound keys for Rows and Columns (e.g., "Budget | 202401")
      const rKey = rowDimensions.length 
        ? rowDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
        : 'All Rows';
        
      const cKey = colDimensions.length 
        ? colDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
        : 'Total';

      rowSet.add(rKey);
      colSet.add(cKey);

      // 2. Map the value to the exact intersection in the matrix
      if (!matrix[rKey]) matrix[rKey] = {};
      
      const val = Number(row[measureKey]) || 0;
      matrix[rKey][cKey] = (matrix[rKey][cKey] || 0) + val; // Sum aggregation
    });

    return { 
      rowHeaders: Array.from(rowSet).sort(), 
      colHeaders: Array.from(colSet).sort(), 
      dataMatrix: matrix 
    };
  }, [data, rowDimensions, colDimensions, measures]);

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

  // 4. Render the Pivot Matrix
  const cornerLabel = rowDimensions.length > 0 
    ? rowDimensions.map(d => d.replace('dimension_', '').replace('_', ' ')).join(' / ') 
    : 'Metrics';

  return (
    <div className="w-full overflow-x-auto bg-surface border border-border rounded-md shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-background border-b border-border">
            {/* Top-Left Corner Cell (Row Headers) */}
            <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap capitalize sticky left-0 bg-background z-10 border-r border-border">
              {cornerLabel}
            </th>
            
            {/* Dynamic Column Headers */}
            {colHeaders.map((colKey) => (
              <th
                key={colKey}
                className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap"
              >
                {colKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowHeaders.map((rowKey) => (
            <tr
              key={rowKey}
              className="hover:bg-background/50 transition-colors"
            >
              {/* Row Header Cell (Sticky on scroll) */}
              <td className="px-4 py-2 whitespace-nowrap font-medium text-foreground sticky left-0 bg-surface border-r border-border shadow-[1px_0_0_0_theme('colors.border')]">
                {rowKey}
              </td>
              
              {/* Intersecting Data Cells */}
              {colHeaders.map((colKey) => {
                const cellValue = dataMatrix[rowKey]?.[colKey];
                
                const displayValue = cellValue !== undefined
                  ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(cellValue)
                  : '-';

                return (
                  <td
                    key={`${rowKey}-${colKey}`}
                    className="px-4 py-2 whitespace-nowrap text-surface-foreground text-right font-mono"
                  >
                    {displayValue}
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
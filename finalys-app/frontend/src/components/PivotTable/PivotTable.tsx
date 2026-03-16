import React, { useMemo } from 'react';
import type { PivotRow } from '../../types/pivot.types';

export interface PivotTableProps {
  data: PivotRow[];
  dimensions?: string[]; 
  rowDimensions: string[]; 
  colDimensions: string[]; 
  measures: string[];
  dimensionMap?: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  onCellClick?: (value: number, coordinates: Record<string, any>) => void;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  data,
  rowDimensions,
  colDimensions,
  measures,
  dimensionMap = {}, 
  isLoading,
  error,
  onCellClick
}) => {

  // --- MATRIX CALCULATION LOGIC ---
  // NOTICE: We are now correctly destructuring coordMap here!
  const { rowHeaders, colHeaders, dataMatrix, coordMap } = useMemo(() => {
    if (!data || data.length === 0) {
      return { rowHeaders: [], colHeaders: [], dataMatrix: {}, coordMap: {} };
    }

    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};
    const coords: Record<string, Record<string, any>> = {};

    const measureKey = measures[0] || 'amount';

    data.forEach(row => {
      // 1. Generate keys
      const rKey = rowDimensions.length 
        ? rowDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
        : 'All Rows';
        
      const cKey = colDimensions.length 
        ? colDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
        : 'Total';

      rowSet.add(rKey);
      colSet.add(cKey);

      // 2. Store original coordinate values for the Popover
      if (!coords[rKey]) {
        coords[rKey] = {};
        rowDimensions.forEach(d => { coords[rKey][d] = row[d]; });
      }
      if (!coords[cKey]) {
        coords[cKey] = {};
        colDimensions.forEach(d => { coords[cKey][d] = row[d]; });
      }

      // 3. Map the value
      if (!matrix[rKey]) matrix[rKey] = {};
      const val = Number(row[measureKey]) || 0;
      matrix[rKey][cKey] = (matrix[rKey][cKey] || 0) + val; 
    });

    return { 
      rowHeaders: Array.from(rowSet).sort(), 
      colHeaders: Array.from(colSet).sort(), 
      dataMatrix: matrix,
      coordMap: coords 
    };
  }, [data, rowDimensions, colDimensions, measures]);

  if (error) {
    return (
      <div className="p-4 border border-destructive bg-destructive/10 text-destructive rounded-md">
        <h3 className="font-semibold">Failed to load analytics data</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border rounded-md shadow-sm">
        <div className="text-primary animate-pulse font-medium">
          Aggregating data in BigQuery...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border rounded-md shadow-sm text-surface-foreground/60">
        No data matches the current filters and dimensions.
      </div>
    );
  }

  const cornerLabel = rowDimensions.length > 0 
    ? rowDimensions.map(d => dimensionMap[d] || d).join(' / ') 
    : 'Metrics';

  return (
    <div className="w-full overflow-x-auto bg-surface border border-border rounded-md shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-background border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap capitalize sticky left-0 bg-background z-10 border-r border-border">
              {cornerLabel}
            </th>
            {colHeaders.map((colKey) => (
              <th key={colKey} className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                {colKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowHeaders.map((rowKey) => (
            <tr key={rowKey} className="hover:bg-background/50 transition-colors">
              <td className="px-4 py-2 whitespace-nowrap font-medium text-foreground sticky left-0 bg-surface border-r border-border shadow-[1px_0_0_0_theme('colors.border')]">
                {rowKey}
              </td>
              
              {colHeaders.map((colKey) => {
                const rawValue = dataMatrix[rowKey]?.[colKey];
                const cellValue = rawValue ?? 0;
                
                const displayValue = rawValue !== undefined
                  ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(rawValue)
                  : '-';

                return (
                  <td
                    key={`${rowKey}-${colKey}`}
                    className="px-4 py-2 whitespace-nowrap text-surface-foreground text-right font-mono cursor-pointer hover:bg-blue-100/50 transition-all border-l border-transparent hover:border-blue-400"
                    onClick={() => {
                      if (onCellClick) {
                        const combinedCoords = {
                          ...(coordMap[rowKey] || {}),
                          ...(coordMap[colKey] || {})
                        };
                        onCellClick(cellValue, combinedCoords);
                      }
                    }}
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
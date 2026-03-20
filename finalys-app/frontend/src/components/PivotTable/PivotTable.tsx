import React, { useMemo } from 'react';
import type { PivotRow } from '../../types/pivot.types';
import { generatePivotMatrix } from '../../utils/pivotMatrixUtil';

export interface PivotTableProps {
  data: PivotRow[];
  rowDimensions: string[]; 
  colDimensions: string[]; 
  measures: string[];
  dimensionMap?: Record<string, string>;
  dimensionSettings?: Record<string, any>; // <-- NEW PROP ADDED
  isLoading: boolean;
  error: string | null;
  showVariance?: boolean;
  datasetIds?: string[];
  datasetDirection?: 'row' | 'col';
  onCellClick?: (value: number, coordinates: Record<string, any>) => void;
}

export const PivotTable: React.FC<PivotTableProps> = ({
  data,
  rowDimensions,
  colDimensions,
  measures,
  dimensionMap = {}, 
  dimensionSettings = {}, // <-- NEW PROP ADDED
  isLoading,
  error,
  showVariance = false,
  datasetIds = [],
  datasetDirection = 'col',
  onCellClick
}) => {

  const { rowHeaders, colHeaders, dataMatrix, coordMap } = useMemo(() => {
    return generatePivotMatrix({
      data,
      rowDimensions,
      colDimensions,
      measures,
      showVariance,
      datasetIds,
      datasetDirection
    });
  }, [data, rowDimensions, colDimensions, measures, showVariance, datasetIds, datasetDirection]);

  // HELPER: Translates raw IDs respecting the dimension settings (ID, Name, or ID - Name)
  const formatLabel = (key: string, dimensionIds: string[]) => {
    if (key.includes('Variance')) return key;
    
    // Safely split keeping the delimiters
    const parts = key.split(/(\s*[/|-]\s*|\s*\|\s*)/);
    let dimIndex = 0;
    
    return parts.map(part => {
      // If it's just a separator, return it untouched
      if (/^(\s*[/|-]\s*|\s*\|\s*)$/.test(part)) return part;

      const trimmed = part.trim();
      const searchKey = trimmed.toLowerCase();
      const matchedName = dimensionMap[trimmed] || dimensionMap[searchKey] || trimmed;
      
      // Look up the specific format setting for this dimension
      const currentDimId = dimensionIds[dimIndex];
      dimIndex++; // Increment so the next part maps to the next dimension

      const setting = currentDimId ? dimensionSettings[currentDimId] : null;
      const displayFormat = setting?.display || 'name'; // Default to Name Only

      // Apply the user's chosen display setting
      if (displayFormat === 'id') return trimmed;
      if (displayFormat === 'id-name') return `${trimmed} - ${matchedName}`;
      return matchedName; 

    }).join('');
  };

  if (error) return <div className="p-4 text-destructive bg-destructive/10 border border-destructive/20 rounded-md">Error: {error}</div>;
  if (isLoading) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground">Aggregating...</div>;
  if (!data || data.length === 0) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground">No data matches the current filters.</div>;

  const cornerLabel = rowDimensions.length > 0 ? rowDimensions.map(d => dimensionMap[d] || d).join(' / ') : 'Metrics';

  return (
    <div className="w-full overflow-x-auto bg-surface border border-border rounded-md shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-interactive-muted/30 border-b border-border">
            <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap sticky left-0 bg-interactive-muted/30 z-10 border-r border-border">
              {cornerLabel}
            </th>
            {colHeaders.map((colKey) => (
              <th key={colKey} className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${colKey.includes('Variance') ? 'text-emerald-700 bg-emerald-50/50' : 'text-foreground'}`}>
                {/* Passed colDimensions context so it knows which setting to look up */}
                {formatLabel(colKey, colDimensions)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rowHeaders.map((rowKey) => {
            const isVarianceRow = rowKey.includes('Variance');
            
            return (
              <tr key={rowKey} className={`hover:bg-interactive-muted/50 transition-colors ${isVarianceRow ? 'bg-emerald-50/20' : ''}`}>
                <td className={`px-4 py-2 whitespace-nowrap font-medium sticky left-0 border-r border-border shadow-[1px_0_0_0_var(--color-border)]
                  ${isVarianceRow ? 'text-emerald-800 bg-emerald-50' : 'text-foreground bg-surface'}
                `}>
                  {/* Passed rowDimensions context so it knows which setting to look up */}
                  {formatLabel(rowKey, rowDimensions)}
                </td>
                
                {colHeaders.map((colKey) => {
                  const rawValue = dataMatrix[rowKey]?.[colKey];
                  const cellValue = rawValue ?? 0;
                  const displayValue = rawValue !== undefined ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(rawValue) : '-';

                  const isVarianceCell = colKey.includes('Variance') || isVarianceRow;

                  return (
                    <td
                      key={`${rowKey}-${colKey}`}
                      className={`px-4 py-2 whitespace-nowrap text-right font-mono transition-all border-l border-transparent
                        ${isVarianceCell 
                          ? (cellValue < 0 ? 'text-destructive bg-destructive/10' : 'text-emerald-700 bg-emerald-50/20') 
                          : 'text-muted-foreground cursor-pointer hover:bg-interactive-muted hover:border-interactive ring-interactive'
                        }
                      `}
                      onClick={() => {
                        if (onCellClick && !isVarianceCell) {
                          const combinedCoords = { ...(coordMap[rowKey] || {}), ...(coordMap[colKey] || {}) };
                          onCellClick(cellValue, combinedCoords);
                        }
                      }}
                    >
                      {displayValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
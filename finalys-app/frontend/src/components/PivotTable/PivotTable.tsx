// /frontend/src/components/PivotTable/PivotTable.tsx
import React, { useMemo } from 'react';
import type { PivotRow } from '../../types/pivot.types';
import { generatePivotMatrix } from '../../utils/pivotMatrixUtil';

export interface PivotTableProps {
  data: PivotRow[];
  rowDimensions: string[]; 
  colDimensions: string[]; 
  measures: string[];
  dimensionMap?: Record<string, string>;
  dimensionSettings?: Record<string, any>;
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
  dimensionSettings = {}, 
  isLoading,
  error,
  showVariance = false,
  datasetIds = [],
  datasetDirection = 'col',
  onCellClick
}) => {

  const { 
    rowHeaders, 
    colHeaders, 
    dataMatrix, 
    coordMap, 
    colHeaderRows, 
    rowHeaderGrid 
  } = useMemo(() => {
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

  // HELPER: Translates individual segments (rawId) using the appropriate dimension index settings
  const formatLabel = (rawId: string, dimIndex: number, dimensionIds: string[]) => {
    if (!rawId || rawId.includes('Variance')) return rawId;
    
    const trimmed = rawId.trim();
    const searchKey = trimmed.toLowerCase();
    const matchedName = dimensionMap[trimmed] || dimensionMap[searchKey] || trimmed;
    
    const currentDimId = dimensionIds[dimIndex];
    const setting = currentDimId ? dimensionSettings[currentDimId] : null;
    const displayFormat = setting?.display || 'name'; 

    if (displayFormat === 'id') return trimmed;
    if (displayFormat === 'id-name') return `${trimmed} - ${matchedName}`;
    return matchedName; 
  };

  if (error) return <div className="p-4 text-destructive bg-destructive/10 border border-destructive/20 rounded-md shadow-sm">Error: {error}</div>;
  if (isLoading) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground font-medium">Aggregating...</div>;
  if (!data || data.length === 0) return <div className="w-full h-64 flex items-center justify-center text-muted-foreground font-medium">No data matches the current filters.</div>;

  const cornerLabel = rowDimensions.length > 0 ? rowDimensions.map(d => dimensionMap[d] || d).join(' / ') : 'Metrics';

  return (
    <div className="w-full max-h-[70vh] overflow-auto bg-surface border border-border rounded-md shadow-sm relative">
      <table className="w-full border-collapse text-sm">
        
        {/* --- DYNAMIC MULTI-TIERED COLUMN HEADERS --- */}
        <thead className="sticky top-0 z-20">
          {colHeaderRows.length === 0 && (
            <tr className="bg-interactive-muted/30 border-b border-border shadow-sm">
              <th className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap sticky left-0 z-30 bg-surface border-r border-border shadow-[1px_0_0_0_var(--color-border)]">
                {cornerLabel}
              </th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Total</th>
            </tr>
          )}

          {colHeaderRows.map((row, rowIndex) => {
            const isLastHeaderRow = rowIndex === colHeaderRows.length - 1;
            return (
              <tr key={rowIndex} className="border-b border-border shadow-sm">
                
                {/* 1. Render the top-left intersection corner ONLY on the first row */}
                {rowIndex === 0 && (
                  <th 
                    rowSpan={colHeaderRows.length} 
                    colSpan={rowHeaderGrid[0]?.length || 1}
                    className="px-4 py-3 text-left font-semibold text-foreground whitespace-nowrap sticky left-0 z-30 bg-surface border-r border-border shadow-[1px_0_0_0_var(--color-border)] align-bottom"
                  >
                    {cornerLabel}
                  </th>
                )}

                {/* 2. Render the nested column headers */}
                {row.map((cell, cellIndex) => (
                  <th 
                    key={`${rowIndex}-${cellIndex}`} 
                    colSpan={cell.colSpan}
                    className={`px-4 py-2 whitespace-nowrap align-middle
                      ${isLastHeaderRow ? 'text-right text-xs font-semibold' : 'text-center text-xs font-bold border-r border-border'}
                      ${cell.isVariance 
                        ? 'text-emerald-800 bg-emerald-50/90' 
                        : (isLastHeaderRow ? 'text-foreground bg-surface' : 'text-interactive bg-interactive-muted/80')
                      }
                    `}
                  >
                    {formatLabel(cell.rawId, rowIndex, colDimensions)}
                  </th>
                ))}
              </tr>
            );
          })}
        </thead>

        {/* --- DYNAMIC ROW HEADERS & DATA MATRIX --- */}
        <tbody className="divide-y divide-border">
          {rowHeaders.map((rKey, rIndex) => {
            const isVarianceRow = rKey.includes('Variance');
            const rowCells = rowHeaderGrid[rIndex];
            
            return (
              <tr key={rKey} className={`hover:bg-interactive-muted/40 transition-colors group ${isVarianceRow ? 'bg-emerald-50/20' : ''}`}>
                
                {/* 1. Render grouped Row Dimensions */}
                {rowCells?.map((cell, cIndex) => {
                  if (!cell.visible) return null; // Hidden by a previous rowSpan

                  const isLastDimCol = cIndex === rowCells.length - 1;
                  // To prevent stacking overlaps, only the strict outermost left column is sticky
                  const isSticky = cIndex === 0;

                  return (
                    <th
                      key={`${rIndex}-${cIndex}`}
                      rowSpan={cell.rowSpan}
                      className={`px-4 py-2 whitespace-nowrap text-left font-medium align-top border-b border-border
                        ${isSticky ? 'sticky left-0 z-10' : ''}
                        ${isLastDimCol ? 'border-r shadow-[1px_0_0_0_var(--color-border)]' : 'border-r border-border/50'}
                        ${cell.isVariance ? 'text-emerald-800 bg-emerald-50' : 'text-foreground bg-surface'}
                      `}
                    >
                      {formatLabel(cell.rawId, cIndex, rowDimensions)}
                    </th>
                  );
                })}

                {/* 2. Render the Data Cells */}
                {colHeaders.map((cKey) => {
                  const rawValue = dataMatrix[rKey]?.[cKey];
                  const cellValue = rawValue ?? 0;
                  const displayValue = rawValue !== undefined ? new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(rawValue) : '-';

                  const isVarianceCell = cKey.includes('Variance') || isVarianceRow;

                  return (
                    <td
                      key={`${rKey}-${cKey}`}
                      className={`px-4 py-2 whitespace-nowrap text-right font-mono transition-all border-l border-transparent
                        ${isVarianceCell 
                          ? (cellValue < 0 ? 'text-destructive bg-destructive/10' : 'text-emerald-700 bg-emerald-50/20') 
                          : 'text-muted-foreground cursor-pointer hover:bg-interactive-muted hover:border-interactive ring-interactive'
                        }
                      `}
                      onClick={() => {
                        if (onCellClick && !isVarianceCell) {
                          const combinedCoords = { ...(coordMap[rKey] || {}), ...(coordMap[cKey] || {}) };
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
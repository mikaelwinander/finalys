// /frontend/src/components/PivotTable/PivotTable.tsx
import React, { useMemo, useState, useCallback } from 'react';
import type { PivotRow } from '../../types/pivot.types';
import { generatePivotMatrix } from '../../utils/pivotMatrixUtil';
import { type VarianceDef } from '../../hooks/usePivotDragDrop'; // <-- NEW IMPORT

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
  variances?: VarianceDef[]; // <-- NEW PROP ADDED
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
  variances = [], // <-- NEW PROP EXTRACTED
  datasetIds = [],
  datasetDirection = 'col',
  onCellClick
}) => {

  // --- STATE FOR COLUMN RESIZING ---
  const [rowDimWidths, setRowDimWidths] = useState<Record<number, number>>({});
  const [globalDataWidth, setGlobalDataWidth] = useState<number | undefined>(undefined);

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
      variances,
      datasetIds,
      datasetDirection,
      dimensionSettings
    });
  }, [data, rowDimensions, colDimensions, measures, showVariance, variances, datasetIds, datasetDirection, dimensionSettings]); // <-- ADDED TO DEP ARRAY

  const formatLabel = (rawId: string, dimIndex: number, dimensionIds: string[]) => {
    if (!rawId) return rawId;
    
    // --- NEW: Prettify the Variance Label ---
    if (rawId.startsWith('Variance (')) {
      const match = rawId.match(/Variance \((.*?) - (.*?)\)/);
      if (match) {
        // Translate the raw dataset IDs using our dictionary!
        const name1 = dimensionMap[match[1]] || match[1];
        const name2 = dimensionMap[match[2]] || match[2];
        return `Variance (${name1} - ${name2})`;
      }
      return rawId;
    }
    
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

  // HELPER: Resizes Row Dimension Columns (Independent by Index)
  const handleRowDimMouseDown = useCallback((index: number, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const thElement = (e.target as HTMLElement).parentElement;
    const startWidth = thElement?.offsetWidth || 150;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(60, startWidth + (moveEvent.clientX - startX));
      setRowDimWidths(prev => ({ ...prev, [index]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // HELPER: Resizes Data Columns (Unified for symmetry)
  const handleDataColMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const startX = e.clientX;
    const thElement = (e.target as HTMLElement).parentElement;
    const startWidth = thElement?.offsetWidth || 100;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      setGlobalDataWidth(newWidth); // <-- Updates the single global state
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    document.body.style.cursor = 'col-resize';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

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
              <th className="px-4 py-3 text-right font-semibold text-foreground border border-border/50">Total</th>
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
                {row.map((cell, cellIndex) => {
                  // Only apply the global width to the lowest leaf nodes
                  const customWidth = isLastHeaderRow ? globalDataWidth : undefined;
                  
                  return (
                    <th 
                      key={`${rowIndex}-${cellIndex}`} 
                      colSpan={cell.colSpan}
                      style={customWidth ? { width: customWidth, minWidth: customWidth, maxWidth: customWidth } : {}}
                      className={`relative px-4 py-2 align-middle border border-border/50 transition-all
                        ${!customWidth ? 'whitespace-nowrap' : 'wrap-break-word'}
                        ${isLastHeaderRow ? 'text-right text-xs font-semibold' : 'text-center text-xs font-bold'}
                        ${cell.isVariance 
                          ? 'text-emerald-800 bg-emerald-50/90' 
                          : (isLastHeaderRow ? 'text-foreground bg-surface' : 'text-interactive bg-interactive-muted/80')
                        }
                      `}
                    >
                      {formatLabel(cell.rawId, rowIndex, colDimensions)}

                      {/* RESIZE HANDLE: Unified controller on leaf nodes */}
                      {isLastHeaderRow && (
                        <div 
                          onMouseDown={handleDataColMouseDown}
                          className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-interactive z-20 transition-colors"
                          title="Drag to resize all data columns"
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            );
          })}
        </thead>

        {/* --- DYNAMIC ROW HEADERS & DATA MATRIX --- */}
        <tbody className="divide-y divide-border/50">
          {rowHeaders.map((rKey, rIndex) => {
            const isVarianceRow = rKey.includes('Variance');
            const rowCells = rowHeaderGrid[rIndex];
            
            return (
              <tr key={rKey} className={`hover:bg-interactive-muted/40 transition-colors group ${isVarianceRow ? 'bg-emerald-50/20' : ''}`}>
                
                {/* 1. Render grouped Row Dimensions */}
                {rowCells?.map((cell, cIndex) => {
                  if (!cell.visible) return null; 

                  const isLastDimCol = cIndex === rowCells.length - 1;
                  const isSticky = cIndex === 0;
                  const customWidth = rowDimWidths[cIndex];

                  return (
                    <th
                      key={`${rIndex}-${cIndex}`}
                      rowSpan={cell.rowSpan}
                      style={customWidth ? { width: customWidth, minWidth: customWidth, maxWidth: customWidth } : {}}
                      className={`relative px-4 py-2 text-left font-medium align-top border border-border/50 transition-all
                        ${!customWidth ? 'whitespace-nowrap' : 'wrap-break-word'}
                        ${isSticky ? 'sticky left-0 z-10' : ''}
                        ${isLastDimCol ? 'border-r-border shadow-[1px_0_0_0_var(--color-border)]' : ''}
                        ${cell.isVariance ? 'text-emerald-800 bg-emerald-50' : 'text-foreground bg-surface'}
                      `}
                    >
                      {formatLabel(cell.rawId, cIndex, rowDimensions)}
                      
                      <div 
                        onMouseDown={(e) => handleRowDimMouseDown(cIndex, e)}
                        className="absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize hover:bg-interactive z-20 transition-colors"
                        title="Drag to resize column"
                      />
                    </th>
                  );
                })}

                {/* 2. Render the Data Cells */}
                {colHeaders.map((cKey) => {
                  const rawValue = dataMatrix[rKey]?.[cKey];
                  const cellValue = rawValue ?? 0;
                  const displayValue = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(cellValue);

                  const isVarianceCell = cKey.includes('Variance') || isVarianceRow;

                  return (
                    <td
                      key={`${rKey}-${cKey}`}
                      style={globalDataWidth ? { width: globalDataWidth, minWidth: globalDataWidth, maxWidth: globalDataWidth } : {}}
                      className={`px-4 py-2 text-right font-mono transition-all border border-border/50 overflow-hidden
                        ${!globalDataWidth ? 'whitespace-nowrap' : 'wrap-break-word'}
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
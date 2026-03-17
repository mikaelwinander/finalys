import React, { useMemo } from 'react';
import type { PivotRow } from '../../types/pivot.types';
import { generatePivotMatrix } from '../../utils/pivotMatrixUtil';

export interface PivotTableProps {
  data: PivotRow[];
  rowDimensions: string[]; 
  colDimensions: string[]; 
  measures: string[];
  dimensionMap?: Record<string, string>;
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

  if (error) return <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (isLoading) return <div className="w-full h-64 flex items-center justify-center">Aggregating...</div>;
  if (!data || data.length === 0) return <div className="w-full h-64 flex items-center justify-center text-gray-500">No data matches the current filters.</div>;

  const cornerLabel = rowDimensions.length > 0 ? rowDimensions.map(d => dimensionMap[d] || d).join(' / ') : 'Metrics';

  return (
    <div className="w-full overflow-x-auto bg-surface border border-border rounded-md shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
              {cornerLabel}
            </th>
            {colHeaders.map((colKey) => (
              <th key={colKey} className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${colKey.includes('Variance') ? 'text-emerald-700 bg-emerald-50/50' : 'text-gray-700'}`}>
                {colKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rowHeaders.map((rowKey) => {
            const isVarianceRow = rowKey.includes('Variance');
            
            return (
              <tr key={rowKey} className={`hover:bg-gray-50 transition-colors ${isVarianceRow ? 'bg-emerald-50/20' : ''}`}>
                <td className={`px-4 py-2 whitespace-nowrap font-medium sticky left-0 border-r border-gray-200 shadow-[1px_0_0_0_#e5e7eb]
                  ${isVarianceRow ? 'text-emerald-800 bg-emerald-50' : 'text-gray-900 bg-white'}
                `}>
                  {rowKey}
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
                          ? (cellValue < 0 ? 'text-red-600 bg-red-50/20' : 'text-emerald-700 bg-emerald-50/20') 
                          : 'text-gray-600 cursor-pointer hover:bg-blue-100/50 hover:border-blue-400'
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
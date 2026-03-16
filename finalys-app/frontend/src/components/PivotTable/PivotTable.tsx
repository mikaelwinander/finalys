// /frontend/src/components/PivotTable/PivotTable.tsx
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
  showVariance?: boolean;
  datasetIds?: string[];
  datasetDirection?: 'row' | 'col'; // <--- NEW: Pivots the Datasets themselves!
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
    if (!data || data.length === 0) {
      return { rowHeaders: [], colHeaders: [], dataMatrix: {}, coordMap: {} };
    }

    const rowSet = new Set<string>();
    const colSet = new Set<string>();
    const matrix: Record<string, Record<string, number>> = {};
    const coords: Record<string, Record<string, any>> = {};

    const measureKey = measures[0] || 'amount';

    // --- PHASE 1: DYNAMIC MATRIX GENERATION ---
    data.forEach(row => {
      // 1. Establish the base grouping keys without datasets
      const rBase = rowDimensions.length 
        ? rowDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
        : 'All Rows';
        
      const cBase = colDimensions.length 
        ? colDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ')
        : 'Total';

      let rKey = rBase;
      let cKey = cBase;

      // 2. Inject the Dataset ID into either the Row or the Column!
      if (datasetDirection === 'row') {
        rKey = rBase === 'All Rows' ? row.datasetId : `${rBase} | ${row.datasetId}`;
      } else {
        cKey = cBase === 'Total' ? row.datasetId : `${row.datasetId} | ${cBase}`;
      }

      rowSet.add(rKey);
      colSet.add(cKey);

      // 3. Map Coordinates securely
      if (!coords[rKey]) {
        coords[rKey] = {};
        rowDimensions.forEach(d => { coords[rKey][d] = row[d]; });
        if (datasetDirection === 'row') coords[rKey].datasetId = row.datasetId;
      }
      if (!coords[cKey]) {
        coords[cKey] = {}; 
        colDimensions.forEach(d => { coords[cKey][d] = row[d]; });
        if (datasetDirection === 'col') coords[cKey].datasetId = row.datasetId;
      }

      // 4. Populate Matrix
      if (!matrix[rKey]) matrix[rKey] = {};
      matrix[rKey][cKey] = (matrix[rKey][cKey] || 0) + (Number(row[measureKey]) || 0); 
    });

    // --- PHASE 2: DYNAMIC VARIANCE CALCULATION ---
    if (showVariance && datasetIds.length === 2) {
      const ds1 = datasetIds[0];
      const ds2 = datasetIds[1];

      if (datasetDirection === 'col') {
        // Variance as Columns
        const cBases = new Set<string>();
        Array.from(colSet).forEach(c => {
          if (c === ds1) cBases.add('Total');
          else if (c.startsWith(`${ds1} | `)) cBases.add(c.substring(ds1.length + 3));
        });

        cBases.forEach(cBase => {
          const cKeyDs1 = cBase === 'Total' ? ds1 : `${ds1} | ${cBase}`;
          const cKeyDs2 = cBase === 'Total' ? ds2 : `${ds2} | ${cBase}`;
          const cKeyVar = cBase === 'Total' ? `Variance (${ds1} - ${ds2})` : `Variance | ${cBase}`;

          colSet.add(cKeyVar);

          Array.from(rowSet).forEach(rKey => {
            if (!matrix[rKey]) matrix[rKey] = {};
            matrix[rKey][cKeyVar] = (matrix[rKey]?.[cKeyDs1] || 0) - (matrix[rKey]?.[cKeyDs2] || 0);
          });
        });
      } else {
        // Variance as Rows
        const rBases = new Set<string>();
        Array.from(rowSet).forEach(r => {
          if (r === ds1) rBases.add('All Rows');
          else if (r.endsWith(` | ${ds1}`)) rBases.add(r.substring(0, r.length - ds1.length - 3));
        });

        rBases.forEach(rBase => {
          const rKeyDs1 = rBase === 'All Rows' ? ds1 : `${rBase} | ${ds1}`;
          const rKeyDs2 = rBase === 'All Rows' ? ds2 : `${rBase} | ${ds2}`;
          const rKeyVar = rBase === 'All Rows' ? `Variance (${ds1} - ${ds2})` : `${rBase} | Variance`;

          rowSet.add(rKeyVar);
          if (!matrix[rKeyVar]) matrix[rKeyVar] = {};

          Array.from(colSet).forEach(cKey => {
            matrix[rKeyVar][cKey] = (matrix[rKeyDs1]?.[cKey] || 0) - (matrix[rKeyDs2]?.[cKey] || 0);
          });
        });
      }
    }

    return { 
      rowHeaders: Array.from(rowSet).sort(), 
      colHeaders: Array.from(colSet).sort(), 
      dataMatrix: matrix,
      coordMap: coords 
    };
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
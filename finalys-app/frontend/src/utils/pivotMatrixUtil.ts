// /frontend/src/utils/pivotMatrixUtil.ts
import type { PivotRow } from '../types/pivot.types';
import { type VarianceDef } from '../hooks/usePivotDragDrop'; // <-- NEW

export interface MatrixParams {
  data: PivotRow[];
  rowDimensions: string[];
  colDimensions: string[];
  measures: string[];
  variances?: VarianceDef[]; // <-- NEW
  datasetIds: string[];
  datasetDirection?: 'row' | 'col'; 
  dimensionSettings?: Record<string, any>; 
}

export interface ColHeaderCell {
  rawId: string;
  colSpan: number;
  isVariance: boolean;
}

export interface RowHeaderCell {
  rawId: string;
  rowSpan: number;
  visible: boolean;
  isVariance: boolean;
}

export interface MatrixResult {
  rowHeaders: string[];
  colHeaders: string[];
  dataMatrix: Record<string, Record<string, number>>;
  coordMap: Record<string, Record<string, any>>;
  colHeaderRows: ColHeaderCell[][];
  rowHeaderGrid: RowHeaderCell[][];
}

export const generatePivotMatrix = ({
  data,
  rowDimensions,
  colDimensions,
  measures,
  variances = [], // <-- NEW
  datasetIds,
  dimensionSettings = {} 
}: MatrixParams): MatrixResult => {
  if (!data || data.length === 0) {
    return { 
      rowHeaders: [], colHeaders: [], dataMatrix: {}, coordMap: {}, 
      colHeaderRows: [], rowHeaderGrid: [] 
    };
  }

  const rowSet = new Set<string>();
  const colSet = new Set<string>();
  const matrix: Record<string, Record<string, number>> = {};
  const coords: Record<string, Record<string, any>> = {};

  const uniqueDimValues: Record<string, Set<string>> = {};
  rowDimensions.filter(d => d !== '__VALUES__').forEach(d => uniqueDimValues[d] = new Set());
  colDimensions.filter(d => d !== '__VALUES__').forEach(d => uniqueDimValues[d] = new Set());

  const usedRowPaths = new Set<string>();
  const usedColPaths = new Set<string>();

  const measureKey = measures[0] || 'amount';

  // --- PHASE 1: COLLECT UNIQUE VALUES & POPULATE DATA MATRIX ---
  data.forEach(row => {
    
    // Force all unique dimension values to be strictly Strings
    rowDimensions.forEach(d => { if (d !== '__VALUES__') uniqueDimValues[d].add(String(row[d] ?? '(Blank)')); });
    colDimensions.forEach(d => { if (d !== '__VALUES__') uniqueDimValues[d].add(String(row[d] ?? '(Blank)')); });

    let rPath = "";
    rowDimensions.forEach(d => {
      // Force the path segment to be a String
      const v = String(d === '__VALUES__' ? row.datasetId : (row[d] ?? '(Blank)'));
      rPath = rPath ? `${rPath} | ${v}` : v;
    });
    usedRowPaths.add(rPath || 'All Rows');
    
    let cPath = "";
    colDimensions.forEach(d => {
      // Force the path segment to be a String
      const v = String(d === '__VALUES__' ? row.datasetId : (row[d] ?? '(Blank)'));
      cPath = cPath ? `${cPath} | ${v}` : v;
    });
    usedColPaths.add(cPath || 'Total');

    const rKey = rPath || 'All Rows';
    const cKey = cPath || 'Total';

    if (!matrix[rKey]) matrix[rKey] = {};
    matrix[rKey][cKey] = (matrix[rKey][cKey] || 0) + (Number(row[measureKey]) || 0); 
  });

  // --- PHASE 2: RECURSIVE DIMENSION COMBINATIONS ---
  const buildBases = (
    dimensions: string[], 
    usedPaths: Set<string>, 
    targetSet: Set<string>, 
    targetCoords: Record<string, Record<string, any>>, 
    depth: number, 
    currentPath: string[],
    fallbackBase: string
  ) => {
    if (depth === dimensions.length) {
      const baseStr = currentPath.length > 0 ? currentPath.join(' | ') : fallbackBase;
      targetSet.add(baseStr);
      targetCoords[baseStr] = {};
      
      dimensions.forEach((d, i) => { 
        if (d === '__VALUES__') targetCoords[baseStr].datasetId = currentPath[i];
        else targetCoords[baseStr][d] = currentPath[i]; 
      });
      return;
    }

    const dim = dimensions[depth];

    if (dim === '__VALUES__') {
      const activeDatasets = [...datasetIds];
      
      // NEW: Push all custom variances into the rendering array!
      variances.forEach(v => {
        activeDatasets.push(`Variance (${v.base} - ${v.compare})`);
      });

      for (const ds of activeDatasets) {
        buildBases(dimensions, usedPaths, targetSet, targetCoords, depth + 1, [...currentPath, ds], fallbackBase);
      }
      return;
    }

    const showAll = dimensionSettings[dim]?.showAllItems ?? false;
    const allVals = Array.from(uniqueDimValues[dim] || []).sort();

    for (const val of allVals) {
      const nextPathStr = currentPath.length > 0 ? `${currentPath.join(' | ')} | ${val}` : val;
      
      if (!showAll) {
        let isValid = false;
        for (const used of usedPaths) {
          if (used.startsWith(nextPathStr) || used.includes(`| ${val}`)) {
            isValid = true; 
            break;
          }
        }
        if (!isValid) continue;
      }
      
      buildBases(dimensions, usedPaths, targetSet, targetCoords, depth + 1, [...currentPath, val], fallbackBase);
    }
  };

  buildBases(rowDimensions, usedRowPaths, rowSet, coords, 0, [], 'All Rows');
  buildBases(colDimensions, usedColPaths, colSet, coords, 0, [], 'Total');

  // --- PHASE 3: CALCULATE DYNAMIC VARIANCE MATRICES ---
  // NEW: Loop through every variance defined by the user!
  variances.forEach(v => {
    const ds1 = v.base;
    const ds2 = v.compare;
    const varLabel = `Variance (${ds1} - ${ds2})`;

    const varRowKeys = Array.from(rowSet).filter(k => k.includes(varLabel));
    const varColKeys = Array.from(colSet).filter(k => k.includes(varLabel));

    if (rowDimensions.includes('__VALUES__')) {
      varRowKeys.forEach(rKeyVar => {
        const rKeyDs1 = rKeyVar.replace(varLabel, ds1);
        const rKeyDs2 = rKeyVar.replace(varLabel, ds2);

        if (!matrix[rKeyVar]) matrix[rKeyVar] = {};
        Array.from(colSet).forEach(cKey => {
          matrix[rKeyVar][cKey] = (matrix[rKeyDs1]?.[cKey] || 0) - (matrix[rKeyDs2]?.[cKey] || 0);
        });
      });
    }

    if (colDimensions.includes('__VALUES__')) {
      varColKeys.forEach(cKeyVar => {
        const cKeyDs1 = cKeyVar.replace(varLabel, ds1);
        const cKeyDs2 = cKeyVar.replace(varLabel, ds2);

        Array.from(rowSet).forEach(rKey => {
          if (!matrix[rKey]) matrix[rKey] = {};
          matrix[rKey][cKeyVar] = (matrix[rKey]?.[cKeyDs1] || 0) - (matrix[rKey]?.[cKeyDs2] || 0);
        });
      });
    }
  });

  const sortedRowHeaders = Array.from(rowSet).sort();
  const sortedColHeaders = Array.from(colSet).sort();

  const buildColHeaderRows = (flatKeys: string[]): ColHeaderCell[][] => {
    if (flatKeys.length === 0) return [];
    
    const splitKeys = flatKeys.map(k => k.split(' | '));
    const maxDepth = Math.max(...splitKeys.map(k => k.length));

    const normalized = splitKeys.map(k => {
      const padded = [...k];
      while (padded.length < maxDepth) padded.push(padded[padded.length - 1] || '');
      return padded;
    });

    const rows: ColHeaderCell[][] = Array.from({ length: maxDepth }, () => []);

    for (let depth = 0; depth < maxDepth; depth++) {
      let currentLabel = normalized[0][depth];
      let span = 1;

      for (let i = 1; i < normalized.length; i++) {
        const parentChainCurrent = normalized[i].slice(0, depth).join('|');
        const parentChainPrev = normalized[i - 1].slice(0, depth).join('|');
        const isSameGroup = normalized[i][depth] === currentLabel && parentChainCurrent === parentChainPrev;

        if (isSameGroup) { span++; } 
        else {
          rows[depth].push({ rawId: currentLabel, colSpan: span, isVariance: currentLabel?.includes('Variance') });
          currentLabel = normalized[i][depth];
          span = 1;
        }
      }
      rows[depth].push({ rawId: currentLabel, colSpan: span, isVariance: currentLabel?.includes('Variance') });
    }
    return rows;
  };

  const buildRowHeaderGrid = (flatKeys: string[]): RowHeaderCell[][] => {
    if (flatKeys.length === 0) return [];
    const splitKeys = flatKeys.map(k => k.split(' | '));
    const maxDepth = Math.max(...splitKeys.map(k => k.length));

    const normalized = splitKeys.map(k => {
      const padded = [...k];
      while (padded.length < maxDepth) padded.push(padded[padded.length - 1] || '');
      return padded;
    });

    const grid: RowHeaderCell[][] = normalized.map(row => 
      row.map(rawId => ({ rawId, rowSpan: 1, visible: true, isVariance: rawId?.includes('Variance') }))
    );

    for (let depth = 0; depth < maxDepth; depth++) {
      let spanCount = 1;
      let spanStartRow = 0;

      for (let r = 1; r < normalized.length; r++) {
        const parentChainCurrent = normalized[r].slice(0, depth).join('|');
        const parentChainPrev = normalized[r - 1].slice(0, depth).join('|');
        const isSameGroup = normalized[r][depth] === normalized[r - 1][depth] && parentChainCurrent === parentChainPrev;

        if (isSameGroup) {
          spanCount++;
          grid[r][depth].visible = false;
          grid[spanStartRow][depth].rowSpan = spanCount;
        } else {
          spanCount = 1;
          spanStartRow = r;
        }
      }
    }
    return grid;
  };

  return { 
    rowHeaders: sortedRowHeaders, 
    colHeaders: sortedColHeaders, 
    dataMatrix: matrix,
    coordMap: coords,
    colHeaderRows: buildColHeaderRows(sortedColHeaders),
    rowHeaderGrid: buildRowHeaderGrid(sortedRowHeaders)
  };
};
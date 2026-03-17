import type { PivotRow } from '../types/pivot.types';

export interface MatrixParams {
  data: PivotRow[];
  rowDimensions: string[];
  colDimensions: string[];
  measures: string[];
  showVariance: boolean;
  datasetIds: string[];
  datasetDirection: 'row' | 'col';
}

export interface MatrixResult {
  rowHeaders: string[];
  colHeaders: string[];
  dataMatrix: Record<string, Record<string, number>>;
  coordMap: Record<string, Record<string, any>>;
}

export const generatePivotMatrix = ({
  data,
  rowDimensions,
  colDimensions,
  measures,
  showVariance,
  datasetIds,
  datasetDirection
}: MatrixParams): MatrixResult => {
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
    const rBase = rowDimensions.length 
      ? rowDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ') 
      : 'All Rows';
      
    const cBase = colDimensions.length 
      ? colDimensions.map(dim => row[dim] ?? '(Blank)').join(' | ')
      : 'Total';

    let rKey = rBase;
    let cKey = cBase;

    if (datasetDirection === 'row') {
      rKey = rBase === 'All Rows' ? row.datasetId : `${rBase} | ${row.datasetId}`;
    } else {
      cKey = cBase === 'Total' ? row.datasetId : `${row.datasetId} | ${cBase}`;
    }

    rowSet.add(rKey);
    colSet.add(cKey);

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

    if (!matrix[rKey]) matrix[rKey] = {};
    matrix[rKey][cKey] = (matrix[rKey][cKey] || 0) + (Number(row[measureKey]) || 0); 
  });

  // --- PHASE 2: DYNAMIC VARIANCE CALCULATION ---
  if (showVariance && datasetIds.length === 2) {
    const ds1 = datasetIds[0];
    const ds2 = datasetIds[1];

    if (datasetDirection === 'col') {
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
};
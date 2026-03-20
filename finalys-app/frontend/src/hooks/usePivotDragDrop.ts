// /frontend/src/hooks/usePivotDragDrop.ts
import { useState, useCallback } from 'react';

export const VALUES_VIRTUAL_DIM = '__VALUES__';

export interface DimSettings {
  display: 'id' | 'name' | 'id-name';
  sortField: 'id' | 'name';
  sortDir: 'asc' | 'desc';
  showAllItems?: boolean; 
}

// NEW: Define the custom variance pair
export interface VarianceDef {
  base: string;
  compare: string;
}

export interface DragDropState {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
  dimensionSettings: Record<string, DimSettings>;
  stagedDatasetIds: string[];
  stagedVariances: VarianceDef[]; // <-- NEW
}

export const usePivotDragDrop = () => {
  const [rowDims, setRowDims] = useState<string[]>([]);
  const [colDims, setColDims] = useState<string[]>([VALUES_VIRTUAL_DIM]);
  const [filterDims, setFilterDims] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>(['amount']); 
  const [dimensionSettings, setDimensionSettings] = useState<Record<string, DimSettings>>({});
  
  const [stagedDatasetIds, setStagedDatasetIds] = useState<string[]>([]);
  const [stagedVariances, setStagedVariances] = useState<VarianceDef[]>([]); // <-- NEW

  const handleDragStart = useCallback((e: React.DragEvent, id: string, sourceZone: string, index: number) => {
    e.dataTransfer.setData('dimId', id);
    e.dataTransfer.setData('sourceZone', sourceZone);
    e.dataTransfer.setData('sourceIndex', index.toString());
    (e.target as HTMLElement).style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetZone: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation(); 

    const dimId = e.dataTransfer.getData('dimId');
    const sourceZone = e.dataTransfer.getData('sourceZone');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);

    if (!dimId) return;
    if (sourceZone === targetZone && sourceIndex === targetIndex) return;

    if (dimId === VALUES_VIRTUAL_DIM) {
      if (targetZone === 'available') return;
      if (targetZone === 'filter') return;
    }

    if (sourceZone === targetZone) {
      const reorder = (prev: string[]) => {
        const newArr = [...prev];
        const [moved] = newArr.splice(sourceIndex, 1);
        if (targetIndex === undefined) newArr.push(moved);
        else newArr.splice(targetIndex, 0, moved);
        return newArr;
      };

      if (targetZone === 'row') setRowDims(reorder);
      if (targetZone === 'col') setColDims(reorder);
      if (targetZone === 'filter') setFilterDims(reorder);

    } else {
      if (sourceZone === 'row') setRowDims(prev => prev.filter((_, i) => i !== sourceIndex));
      if (sourceZone === 'col') setColDims(prev => prev.filter((_, i) => i !== sourceIndex));
      if (sourceZone === 'filter') setFilterDims(prev => prev.filter((_, i) => i !== sourceIndex));

      const insert = (prev: string[]) => {
        const clean = prev.filter(id => id !== dimId); 
        if (targetIndex === undefined) return [...clean, dimId];
        const newArr = [...clean];
        newArr.splice(targetIndex, 0, dimId);
        return newArr;
      };

      if (targetZone !== 'available') {
        if (targetZone === 'row') setRowDims(insert);
        if (targetZone === 'col') setColDims(insert);
        if (targetZone === 'filter') setFilterDims(insert);
      }
    }
  }, []);

  const updateDimSetting = useCallback((dimId: string, settings: DimSettings) => {
    setDimensionSettings(prev => ({ ...prev, [dimId]: settings }));
  }, []);

  const applyLayout = useCallback((
    newRows: string[], newCols: string[], newMeasures: string[], 
    newSettings?: Record<string, DimSettings>,
    newDatasetIds?: string[], newVariances?: VarianceDef[] // <-- NEW
  ) => {
    const safeRows = newRows || [];
    let safeCols = newCols || [];

    if (!safeRows.includes(VALUES_VIRTUAL_DIM) && !safeCols.includes(VALUES_VIRTUAL_DIM)) {
      safeCols = [...safeCols, VALUES_VIRTUAL_DIM];
    }

    setRowDims(safeRows);
    setColDims(safeCols);
    setMeasures(newMeasures || ['amount']);
    if (newSettings) setDimensionSettings(newSettings);
    
    if (newDatasetIds) setStagedDatasetIds(newDatasetIds);
    if (newVariances !== undefined) setStagedVariances(newVariances);
  }, []);

  return {
    rowDims, colDims, filterDims, measures, dimensionSettings,
    stagedDatasetIds, stagedVariances, setStagedDatasetIds, setStagedVariances, // <-- NEW
    setRowDims, setColDims, setFilterDims, updateDimSetting,
    handleDragStart, handleDragEnd, handleDragOver, handleDrop, applyLayout
  };
};
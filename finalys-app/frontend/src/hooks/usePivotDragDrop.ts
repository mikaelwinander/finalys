//finalys-app/frontend/src/hooks/usePivotDragDrop.ts
import { useState, useCallback } from 'react';

export interface DimSettings {
  display: 'id' | 'name' | 'id-name';
  sortField: 'id' | 'name';
  sortDir: 'asc' | 'desc';
}

export interface DragDropState {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
  dimensionSettings: Record<string, DimSettings>;
}

export const usePivotDragDrop = () => {
  const [rowDims, setRowDims] = useState<string[]>([]);
  const [colDims, setColDims] = useState<string[]>([]);
  const [filterDims, setFilterDims] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>(['amount']); // Hardcoded
  
  // NEW: Dictionary to store settings for any dimension that gets customized
  const [dimensionSettings, setDimensionSettings] = useState<Record<string, DimSettings>>({});

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

  const handleDrop = useCallback((e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    const dimId = e.dataTransfer.getData('dimId');
    const sourceZone = e.dataTransfer.getData('sourceZone');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);

    if (!dimId) return;

    // Validation: Prevent duplicates in the same target zone
    if (targetZone === 'row' && rowDims.includes(dimId)) return;
    if (targetZone === 'col' && colDims.includes(dimId)) return;
    if (targetZone === 'filter' && filterDims.includes(dimId)) return;

    const removeByIndex = (arr: string[]) => arr.filter((_, i) => i !== sourceIndex);

    // If it's NOT coming from the palette, remove it from its old spot
    if (sourceZone !== 'available') {
      if (sourceZone === 'row') setRowDims(removeByIndex);
      if (sourceZone === 'col') setColDims(removeByIndex);
      if (sourceZone === 'filter') setFilterDims(removeByIndex);
    }

    // Add to the new target spot (if target is 'available', it acts as a trash can!)
    if (targetZone === 'row') setRowDims(prev => [...prev, dimId]);
    if (targetZone === 'col') setColDims(prev => [...prev, dimId]);
    if (targetZone === 'filter') setFilterDims(prev => [...prev, dimId]);
  }, [rowDims, colDims, filterDims]);

  // Update a specific dimension's settings
  const updateDimSetting = useCallback((dimId: string, settings: DimSettings) => {
    setDimensionSettings(prev => ({ ...prev, [dimId]: settings }));
  }, []);

  const applyLayout = useCallback((newRows: string[], newCols: string[], newMeasures: string[], newSettings?: Record<string, DimSettings>) => {
    setRowDims(newRows || []);
    setColDims(newCols || []);
    setMeasures(newMeasures || ['amount']);
    if (newSettings) setDimensionSettings(newSettings);
  }, []);

  return {
    rowDims, colDims, filterDims, measures, dimensionSettings,
    setRowDims, setColDims, setFilterDims, updateDimSetting,
    handleDragStart, handleDragEnd, handleDragOver, handleDrop, applyLayout
  };
};
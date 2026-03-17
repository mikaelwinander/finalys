import { useState, useCallback } from 'react';

export interface DragDropState {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
}

export const usePivotDragDrop = (availableMeasures: { id: string, label: string }[]) => {
  const [rowDims, setRowDims] = useState<string[]>([]);
  const [colDims, setColDims] = useState<string[]>([]);
  const [filterDims, setFilterDims] = useState<string[]>([]);
  //const [measures, setMeasures] = useState<string[]>([]);
  const [measures, setMeasures] = useState<string[]>(['amount']);

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

    const isMeasure = availableMeasures.some(m => m.id === dimId);
    
    // Validation: Measures only go to measure zone or back to available
    if (isMeasure && targetZone !== 'measure' && targetZone !== 'available') return;
    if (!isMeasure && targetZone === 'measure') return;

    // Validation: Prevent duplicates in the same zone
    if (sourceZone !== targetZone) {
      if (targetZone === 'row' && rowDims.includes(dimId)) return;
      if (targetZone === 'col' && colDims.includes(dimId)) return;
      if (targetZone === 'filter' && filterDims.includes(dimId)) return;
      if (targetZone === 'measure' && measures.includes(dimId)) return;
    }

    const removeByIndex = (arr: string[]) => arr.filter((_, i) => i !== sourceIndex);

    // Remove from source
    if (sourceZone === 'row') setRowDims(removeByIndex);
    if (sourceZone === 'col') setColDims(removeByIndex);
    if (sourceZone === 'filter') setFilterDims(removeByIndex);
    if (sourceZone === 'measure') setMeasures(removeByIndex);

    // Add to target
    if (targetZone === 'row') setRowDims(prev => [...prev, dimId]);
    if (targetZone === 'col') setColDims(prev => [...prev, dimId]);
    if (targetZone === 'filter') setFilterDims(prev => [...prev, dimId]);
    if (targetZone === 'measure') setMeasures(prev => [...prev, dimId]);
  }, [rowDims, colDims, filterDims, measures, availableMeasures]);

  // NEW: Instantly apply a saved template layout
  const applyLayout = useCallback((newRows: string[], newCols: string[], newMeasures: string[]) => {
    setRowDims(newRows || []);
    setColDims(newCols || []);
    setMeasures(newMeasures || []);
    // If you add filter arrays to templates later, you can set them here too!
  }, []);

  return {
    rowDims,
    colDims,
    filterDims,
    measures,
    setRowDims,
    setColDims,
    setFilterDims,
    setMeasures,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    applyLayout // <-- Exported here!
  };
};
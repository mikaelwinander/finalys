// /frontend/src/pages/DashboardPage.tsx
import React, { type FC, useState, useEffect } from 'react';
import { usePivotData } from '../hooks/usePivotData';
import { PivotTable } from '../components/PivotTable/PivotTable';

// Standard measures
const AVAILABLE_MEASURES = [
  { id: 'amount', label: 'Amount (Sum)' }
];

// Fallback dimensions in case the API is slow or fails
const FALLBACK_DIMENSIONS = [
  { id: 'period_id', label: 'Period' },
  { id: 'amount_type_id', label: 'Amount Type' },
  { id: 'dim01', label: 'Dim 01' },
];

const DashboardPage: FC = () => {
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetId, setDatasetId] = useState<string>('');
  
  // NEW: State to hold our dynamic data dictionary from the database
  const [availableDimensions, setAvailableDimensions] = useState<{id: string, label: string}[]>(FALLBACK_DIMENSIONS);

  // 4 Distinct Pivot Zones State
  const [rowDims, setRowDims] = useState<string[]>(['dim01']);
  const [colDims, setColDims] = useState<string[]>(['period_id']);
  const [filterDims, setFilterDims] = useState<string[]>([]); 
  const [measures, setMeasures] = useState<string[]>(['amount']); 

  useEffect(() => {
    // 1. Fetch available datasets
    const fetchDatasets = async () => {
      try {
        const response = await fetch('/api/datasets');
        const json = await response.json();
        let safeArray = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;

        if (safeArray?.length > 0) {
          setAvailableDatasets(safeArray);
          setDatasetId(safeArray[0]);
        }
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
      }
    };

    // 2. Fetch the dynamic Dimension Dictionary!
    const fetchDimensions = async () => {
      try {
        const response = await fetch('/api/dimensions');
        const json = await response.json();
        let safeArray = typeof json.data === 'string' ? JSON.parse(json.data) : json.data;

        if (safeArray?.length > 0) {
          // Map the database rows to the format our UI expects
          const dynamicDims = safeArray.map((d: any) => ({
            id: d.dim_id,
            label: d.dim_name
          }));

          // Prepend standard fields that aren't in the mapping table
          const standardDims = [
            { id: 'period_id', label: 'Period' },
            { id: 'amount_type_id', label: 'Amount Type' }
          ];

          setAvailableDimensions([...standardDims, ...dynamicDims]);
        }
      } catch (error) {
        console.error('Failed to fetch dimensions dictionary:', error);
      }
    };

    fetchDatasets();
    fetchDimensions();
  }, []);

  const activeDimensions = Array.from(new Set([...rowDims, ...colDims]));

  const { data, isLoading, error, refetch } = usePivotData({
    datasetId,
    dimensions: activeDimensions,
    measures,
    filters: {}, 
  });

  // --- HTML5 DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string, sourceZone: string, index: number) => {
    e.dataTransfer.setData('dimId', id);
    e.dataTransfer.setData('sourceZone', sourceZone);
    e.dataTransfer.setData('sourceIndex', index.toString());
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (e: React.DragEvent, targetZone: string) => {
    e.preventDefault();
    const dimId = e.dataTransfer.getData('dimId');
    const sourceZone = e.dataTransfer.getData('sourceZone');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'), 10);

    if (!dimId) return;

    const isMeasure = AVAILABLE_MEASURES.some(m => m.id === dimId);
    if (isMeasure && targetZone !== 'measure' && targetZone !== 'available') return;
    if (!isMeasure && targetZone === 'measure') return;

    if (sourceZone !== targetZone) {
      if (targetZone === 'row' && rowDims.includes(dimId)) return;
      if (targetZone === 'col' && colDims.includes(dimId)) return;
      if (targetZone === 'filter' && filterDims.includes(dimId)) return;
      if (targetZone === 'measure' && measures.includes(dimId)) return;
    }

    const removeByIndex = (arr: string[]) => arr.filter((_, i) => i !== sourceIndex);
    if (sourceZone === 'row') setRowDims(removeByIndex);
    if (sourceZone === 'col') setColDims(removeByIndex);
    if (sourceZone === 'filter') setFilterDims(removeByIndex);
    if (sourceZone === 'measure') setMeasures(removeByIndex);

    if (targetZone === 'row') setRowDims(prev => [...prev, dimId]);
    if (targetZone === 'col') setColDims(prev => [...prev, dimId]);
    if (targetZone === 'filter') setFilterDims(prev => [...prev, dimId]);
    if (targetZone === 'measure') setMeasures(prev => [...prev, dimId]);
  };

  // Helper to resolve string IDs back to their full objects for the UI
  // Now relies on the state variable instead of the hardcoded constant!
  const resolveDim = (id: string) => availableDimensions.find(d => d.id === id) || { id, label: id };
  const resolveMeasure = (id: string) => AVAILABLE_MEASURES.find(m => m.id === id) || { id, label: id };

  const DraggableCard = ({ item, zone, index }: { item: { id: string, label: string }, zone: string, index: number }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, item.id, zone, index)}
      onDragEnd={handleDragEnd}
      className="bg-white border border-gray-200 rounded p-2 mb-2 cursor-grab active:cursor-grabbing shadow-sm hover:border-blue-400 transition-colors"
    >
      <div className="text-sm font-medium text-gray-700">
        <span className="text-gray-400 mr-2">⣿</span>
        {item.label}
      </div>
    </div>
  );

  if (!datasetId) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Financial Overview</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-sm font-medium text-gray-500">Active Version:</span>
            <select 
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 py-1 pl-2 pr-8"
            >
              {availableDatasets.map((ds) => (
                <option key={ds} value={ds}>{ds}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shadow-sm">
          Refresh Data
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN: AVAILABLE SOURCE LISTS */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'available')}>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Available Fields</h3>
            <div className="overflow-y-auto pr-1 flex-1">
              {/* Loop over our newly fetched availableDimensions! */}
              {availableDimensions.map((dim, index) => (
                <DraggableCard key={`source-dim-${dim.id}`} item={dim} zone="available" index={index} />
              ))}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm min-h-[100px]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Measures</h3>
            <div className="pr-1">
              {AVAILABLE_MEASURES.map((measure, index) => (
                <DraggableCard key={`source-measure-${measure.id}`} item={measure} zone="available" index={index} />
              ))}
            </div>
          </div>

        </div>

        {/* MIDDLE AND RIGHT COLUMNS: DROP ZONES & TABLE */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'filter')}>
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Filters</h3>
              {filterDims.map((id, index) => <DraggableCard key={`filter-${id}-${index}`} item={resolveDim(id)} zone="filter" index={index} />)}
              {filterDims.length === 0 && <p className="text-xs text-emerald-500 italic text-center py-2">Drop to filter</p>}
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'col')}>
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Columns</h3>
              {colDims.map((id, index) => <DraggableCard key={`col-${id}-${index}`} item={resolveDim(id)} zone="col" index={index} />)}
              {colDims.length === 0 && <p className="text-xs text-indigo-400 italic text-center py-2">Drop columns</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'row')}>
              <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Rows</h3>
              {rowDims.map((id, index) => <DraggableCard key={`row-${id}-${index}`} item={resolveDim(id)} zone="row" index={index} />)}
              {rowDims.length === 0 && <p className="text-xs text-blue-400 italic text-center py-2">Drop rows</p>}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'measure')}>
              <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Values</h3>
              {measures.map((id, index) => <DraggableCard key={`measure-${id}-${index}`} item={resolveMeasure(id)} zone="measure" index={index} />)}
              {measures.length === 0 && <p className="text-xs text-amber-500 italic text-center py-2">Drop values</p>}
            </div>

          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                Aggregating Data...
              </div>
            ) : (
              <PivotTable 
                data={data}
                rowDimensions={rowDims}
                colDimensions={colDims}
                measures={measures}
                isLoading={isLoading}
                error={error}
              />
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
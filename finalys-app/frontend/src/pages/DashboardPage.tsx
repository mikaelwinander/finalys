// /frontend/src/pages/DashboardPage.tsx
import React, { type FC, useState, useEffect, useMemo } from 'react';
import { AdjustmentPopover } from '../components/analytics/AdjustmentPopover';
import { usePivotData } from '../hooks/usePivotData';
import { PivotTable } from '../components/PivotTable/PivotTable';
import { useAuth } from '../hooks/useAuth'; 

// Standard measures
const AVAILABLE_MEASURES = [
  { id: 'amount', label: 'Amount (Sum)' }
];

// Fallback dimensions in case the API is slow or fails
const FALLBACK_DIMENSIONS = [
  { id: 'period_id', label: 'Period' },
  { id: 'amount_type_id', label: 'Amount Type' },
  { id: 'dim01', label: 'Dim 01' },
  { id: 'dim02', label: 'Dim 02' },
  { id: 'dim03', label: 'Dim 03' },
];

const DashboardPage: FC = () => {
  // 1. Grab BOTH token and the loading state from Identity Platform
  const { token, isLoading: isAuthLoading } = useAuth(); 

  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetId, setDatasetId] = useState<string>('');
  
  const [availableDimensions, setAvailableDimensions] = useState<{id: string, label: string}[]>(FALLBACK_DIMENSIONS);

  // NEW: State machine to prevent the infinite loading spinner
  const [workspaceStatus, setWorkspaceStatus] = useState<'loading' | 'ready' | 'empty' | 'auth_error' | 'api_error'>('loading');

  const [rowDims, setRowDims] = useState<string[]>([]);
  const [colDims, setColDims] = useState<string[]>([]);
  const [filterDims, setFilterDims] = useState<string[]>([]); 
  const [measures, setMeasures] = useState<string[]>([]);

  // NEW: State for the AI Adjustment Modal
  const [selectedCell, setSelectedCell] = useState<{
    value: number;
    coordinates: Record<string, string>;
    datasetId: string;
  } | null>(null);

  useEffect(() => {
    // Wait until Firebase Identity Platform is finished initializing
    if (isAuthLoading) return;

    // Check if user is actually authenticated
    if (!token) {
      setWorkspaceStatus('auth_error');
      return;
    }

    const initWorkspace = async () => {
      try {
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };

        // Run both fetches in parallel for speed
        const [dsResponse, dimResponse] = await Promise.all([
          fetch('/api/datasets', { headers }),
          fetch('/api/dimensions', { headers })
        ]);

        if (!dsResponse.ok || !dimResponse.ok) {
          throw new Error('API returned an error status');
        }

        const dsJson = await dsResponse.json();
        const dimJson = await dimResponse.json();

        let dsArray = typeof dsJson.data === 'string' ? JSON.parse(dsJson.data) : dsJson.data;
        let dimArray = typeof dimJson.data === 'string' ? JSON.parse(dimJson.data) : dimJson.data;

        // Process Dimensions
        if (dimArray?.length > 0) {
          const dynamicDims = dimArray.map((d: any) => ({
            id: d.dim_id,
            label: d.dim_name
          }));
          const standardDims = [
            { id: 'period_id', label: 'Period' },
            { id: 'amount_type_id', label: 'Amount Type' }
          ];
          setAvailableDimensions([...standardDims, ...dynamicDims]);
        }

        // Process Datasets
        if (dsArray?.length > 0) {
          setAvailableDatasets(dsArray);
          setDatasetId(dsArray[0]);
          
          // Data exists! Release the UI lock.
          setWorkspaceStatus('ready');
        } else {
          // Connected, but no data in BigQuery for this client
          setWorkspaceStatus('empty');
        }

      } catch (error) {
        console.error('Failed to initialize workspace:', error);
        setWorkspaceStatus('api_error');
      }
    };

    initWorkspace();
  }, [token, isAuthLoading]);

  const dimensionMap = useMemo(() => {
    const map: Record<string, string> = {};
    availableDimensions.forEach(dim => {
      map[dim.id] = dim.label;
    });
    AVAILABLE_MEASURES.forEach(m => {
      map[m.id] = m.label;
    });
    return map;
  }, [availableDimensions]);

  const activeDimensions = Array.from(new Set([...rowDims, ...colDims]));

  const { data, isLoading, error, refetch } = usePivotData({
    datasetId,
    dimensions: activeDimensions,
    measures,
    filters: {}, 
  });

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

  // --- SAFEGUARD UI RENDERING ---

  if (workspaceStatus === 'loading' || isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (workspaceStatus === 'auth_error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
        <p>You must be logged in to view analytics.</p>
      </div>
    );
  }

  if (workspaceStatus === 'api_error') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-600">
        <h2 className="text-xl font-bold mb-2">API Connection Error</h2>
        <p>Could not connect to the BigQuery API Layer. Check the browser console (F12).</p>
      </div>
    );
  }

  if (workspaceStatus === 'empty') {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-600">
        <h2 className="text-xl font-bold mb-2">No Datasets Found</h2>
        <p>Your database is connected, but no plan versions exist for this client.</p>
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
                dimensionMap={dimensionMap}
                isLoading={isLoading}
                error={error}
                onCellClick={(value, coordinates) => {
                  console.log("Cell clicked!", { value, coordinates }); // Just to be safe!
                  setSelectedCell({
                    value,
                    coordinates,
                    datasetId
                  });
                }}
              />
            )}
          </div>
          
            {/* --- ADD THE POPOVER RENDER BLOCK --- */}
            {selectedCell && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <AdjustmentPopover 
                  cellData={selectedCell} 
                  onClose={() => setSelectedCell(null)}
                  onSuccess={() => {
                    refetch(); // This refreshes your data automatically!
                    setSelectedCell(null);
                  }} 
                />
              </div>
            )}
            {/* ------------------------------------ */}

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
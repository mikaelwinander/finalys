// /frontend/src/pages/DashboardPage.tsx
import React, { type FC, useState, useEffect, useMemo } from 'react';
import { AdjustmentPopover } from '../components/analytics/AdjustmentPopover';
import { SimulationHistoryPanel } from '../components/analytics/SimulationHistoryPanel';
import { usePivotData } from '../hooks/usePivotData';
import { PivotTable } from '../components/PivotTable/PivotTable';
import { useAuth } from '../hooks/useAuth'; 
import { simulationService } from '../services/simulationService';

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
  const { token, isLoading: isAuthLoading } = useAuth(); 

  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetIds, setDatasetIds] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<{id: string, label: string}[]>(FALLBACK_DIMENSIONS);
  const [workspaceStatus, setWorkspaceStatus] = useState<'loading' | 'ready' | 'empty' | 'auth_error' | 'api_error'>('loading');

  const [rowDims, setRowDims] = useState<string[]>([]);
  const [colDims, setColDims] = useState<string[]>([]);
  const [filterDims, setFilterDims] = useState<string[]>([]); 
  const [measures, setMeasures] = useState<string[]>([]);

  // --- SETTINGS STATES (Now managed via the Modal) ---
  const [includeAdjustments, setIncludeAdjustments] = useState(true);
  const [showVariance, setShowVariance] = useState(false);
  const [datasetLayout, setDatasetLayout] = useState<'col' | 'row'>('col');
  
  // Controls the visibility of the new settings modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsMeasure, setActiveSettingsMeasure] = useState<string | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    value: number;
    coordinates: Record<string, string>;
    datasetId: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) {
      setWorkspaceStatus('auth_error');
      return;
    }

    const initWorkspace = async () => {
      try {
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
        const [dsResponse, dimResponse] = await Promise.all([
          fetch('/api/datasets', { headers }),
          fetch('/api/dimensions', { headers })
        ]);

        if (!dsResponse.ok || !dimResponse.ok) throw new Error('API returned an error status');

        const dsJson = await dsResponse.json();
        const dimJson = await dimResponse.json();

        let dsArray = typeof dsJson.data === 'string' ? JSON.parse(dsJson.data) : dsJson.data;
        let dimArray = typeof dimJson.data === 'string' ? JSON.parse(dimJson.data) : dimJson.data;

        if (dimArray?.length > 0) {
          const dynamicDims = dimArray.map((d: any) => ({ id: d.dim_id, label: d.dim_name }));
          const standardDims = [
            { id: 'period_id', label: 'Period' },
            { id: 'amount_type_id', label: 'Amount Type' }
          ];
          setAvailableDimensions([...standardDims, ...dynamicDims]);
        }

        if (dsArray?.length > 0) {
          setAvailableDatasets(dsArray);
          setDatasetIds([dsArray[0]]);
          setWorkspaceStatus('ready');
        } else {
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
    availableDimensions.forEach(dim => { map[dim.id] = dim.label; });
    AVAILABLE_MEASURES.forEach(m => { map[m.id] = m.label; });
    return map;
  }, [availableDimensions]);

  const activeDimensions = Array.from(new Set([...rowDims, ...colDims]));

  const { data, isLoading, error, refetch } = usePivotData({
    datasetIds,
    dimensions: activeDimensions,
    measures,
    filters: {}, 
    includeAdjustments 
  });

  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    if (!datasetIds.length) return;
    setIsHistoryLoading(true);
    try {
      const primaryDataset = datasetIds[0];
      const historyData = await simulationService.getHistory(primaryDataset); 
      setHistory(historyData);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [JSON.stringify(datasetIds), data]); 

  const handleUndo = async (timestampId: string) => {
    if (!window.confirm("Are you sure you want to undo this simulation?")) return;
    try {
      const primaryDataset = datasetIds[0];
      await simulationService.undoAdjustment(primaryDataset, timestampId);
      refetch(); 
    } catch (error) {
      alert("Failed to undo simulation.");
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string, sourceZone: string, index: number) => {
    e.dataTransfer.setData('dimId', id);
    e.dataTransfer.setData('sourceZone', sourceZone);
    e.dataTransfer.setData('sourceIndex', index.toString());
    (e.target as HTMLElement).style.opacity = '0.5';
  };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).style.opacity = '1'; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

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
  const toggleDataset = (ds: string) => setDatasetIds(prev => prev.includes(ds) ? prev.filter(id => id !== ds) : [...prev, ds]);

  // --- UPDATED DRAGGABLE CARD ---
  const DraggableCard = ({ item, zone, index }: { item: { id: string, label: string }, zone: string, index: number }) => {
    const isDroppedMeasure = zone === 'measure';
    
    return (
      <div 
        draggable 
        onDragStart={(e) => handleDragStart(e, item.id, zone, index)} 
        onDragEnd={handleDragEnd} 
        className={`bg-white border rounded p-2 mb-2 shadow-sm transition-colors flex items-center justify-between group
          ${isDroppedMeasure ? 'border-amber-300 hover:border-amber-500' : 'border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing'}`}
      >
        <div className="text-sm font-medium text-gray-700 flex items-center">
          <span className="text-gray-400 mr-2 cursor-grab">⣿</span>
          {item.label}
        </div>
        
        {/* Render a settings gear ONLY if it's currently active in the measure drop zone */}
        {isDroppedMeasure && (
          <button 
            onClick={() => {
              setActiveSettingsMeasure(item.id);
              setIsSettingsModalOpen(true);
            }}
            className="p-1 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors focus:outline-none"
            title="Measure Settings"
          >
            ⚙️
          </button>
        )}
      </div>
    );
  };

  if (workspaceStatus === 'loading' || isAuthLoading) return <div className="flex justify-center items-center h-screen text-gray-500"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div></div>;
  if (workspaceStatus === 'auth_error') return <div className="flex justify-center items-center h-screen text-red-600"><h2>Authentication Required</h2></div>;
  if (workspaceStatus === 'api_error') return <div className="flex justify-center items-center h-screen text-red-600"><h2>API Connection Error</h2></div>;
  if (workspaceStatus === 'empty') return <div className="flex justify-center items-center h-screen text-gray-600"><h2>No Datasets Found</h2></div>;

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 p-4">
      {/* ULTRA-CLEAN HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Financial Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Comparing {datasetIds.length} dataset(s)</p>
          </div>
          <button onClick={refetch} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors">
            Refresh Data
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: AVAILABLE SOURCE LISTS */}
        <div className="w-full lg:w-64 flex-shrink-0 space-y-4" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'available')}>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Available Fields</h3>
            <div className="overflow-y-auto pr-1 flex-1">
              {availableDimensions.map((dim, index) => <DraggableCard key={`source-dim-${dim.id}`} item={dim} zone="available" index={index} />)}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm min-h-[100px]">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Measures</h3>
            <div className="pr-1">
              {AVAILABLE_MEASURES.map((measure, index) => <DraggableCard key={`source-measure-${measure.id}`} item={measure} zone="available" index={index} />)}
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
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'measure')}>
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex justify-between items-center">
                <span>Values</span>
                {measures.length > 0 && <span className="text-[10px] font-normal italic opacity-70">Click ⚙️ for settings</span>}
              </h3>
              {measures.map((id, index) => <DraggableCard key={`measure-${id}-${index}`} item={resolveMeasure(id)} zone="measure" index={index} />)}
              {measures.length === 0 && <p className="text-xs text-amber-600 italic text-center py-2">Drop values</p>}
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
                showVariance={showVariance} 
                datasetIds={datasetIds}     
                datasetDirection={datasetLayout} // <--- Pass the new prop here
                onCellClick={(value, coordinates) => {
                  const cellDatasetId = coordinates.datasetId || datasetIds[0]; 
                  setSelectedCell({ value, coordinates, datasetId: cellDatasetId });
                }}
              />
            )}
          </div>
          
          {selectedCell && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
              <AdjustmentPopover cellData={selectedCell} onClose={() => setSelectedCell(null)} onSuccess={() => { refetch(); setSelectedCell(null); }} />
            </div>
          )}
          
          <SimulationHistoryPanel history={history} onUndo={handleUndo} isLoading={isHistoryLoading} />
        </div>
      </div>

      {/* --- NEW: VALUE FIELD SETTINGS MODAL --- */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {dimensionMap[activeSettingsMeasure || ''] || 'Value'} Settings
              </h2>
              <button onClick={() => setIsSettingsModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              
              {/* Datasets Configuration */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Compare Datasets</label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  {availableDatasets.map((ds) => (
                    <label key={ds} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-white rounded transition-colors">
                      <input 
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={datasetIds.includes(ds)}
                        onChange={() => toggleDataset(ds)}
                      />
                      <span className="text-sm text-gray-800">{ds}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Layout Direction */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                  <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dataset Layout</label>
                  <div className="flex p-1 bg-gray-100 rounded-lg">
                    <button 
                      onClick={() => setDatasetLayout('col')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${datasetLayout === 'col' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Columns
                    </button>
                    <button 
                      onClick={() => setDatasetLayout('row')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${datasetLayout === 'row' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Rows
                    </button>
                  </div>
                </div>

              {/* Adjustments & Variance Toggles */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Calculations</label>
                
                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <span className="text-sm font-medium text-gray-700">Include Adjustments/Simulations</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={includeAdjustments} onChange={(e) => setIncludeAdjustments(e.target.checked)} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {datasetIds.length === 2 && (
                  <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">Calculate Variance</span>
                      <span className="text-xs text-gray-400">Shows difference between the 2 datasets</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={showVariance} onChange={(e) => setShowVariance(e.target.checked)} />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                Apply & Close
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;
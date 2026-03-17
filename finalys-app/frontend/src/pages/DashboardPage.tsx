import { type FC, useState, useEffect, useMemo, useCallback } from 'react';

import { AdminTemplatePopover } from '../components/PivotTable/AdminTemplatePopover';
import { AdjustmentPopover } from '../components/analytics/AdjustmentPopover';
import { SimulationHistoryPanel } from '../components/analytics/SimulationHistoryPanel';
import { usePivotData } from '../hooks/usePivotData';
import { usePivotDragDrop } from '../hooks/usePivotDragDrop';
import { PivotTable } from '../components/PivotTable/PivotTable';
//import { PivotDropZones } from '../components/PivotTable/PivotDropZones';
//import { DraggableCard } from '../components/PivotTable/DraggableCard';
import { useAuth } from '../hooks/useAuth'; 
import { simulationService } from '../services/simulationService';
import { PivotSettingsModal } from '../components/PivotTable/PivotSettingsModal';
import { ConfigurationDrawer } from '../components/PivotTable/ConfigurationDrawer';

const AVAILABLE_MEASURES = [{ id: 'amount', label: 'Amount (Sum)' }];
const FALLBACK_DIMENSIONS = [
  { id: 'period_id', label: 'Period' },
  { id: 'amount_type_id', label: 'Amount Type' },
  { id: 'dim01', label: 'Dim 01' },
];

const DashboardPage: FC = () => {
  const { token, isLoading: isAuthLoading } = useAuth(); 

  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetIds, setDatasetIds] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<{id: string, label: string}[]>(FALLBACK_DIMENSIONS);
  const [workspaceStatus, setWorkspaceStatus] = useState<'loading' | 'ready' | 'empty' | 'auth_error' | 'api_error'>('loading');

  const dragDropState = usePivotDragDrop(AVAILABLE_MEASURES); // This is now your DRAFT state

  // NEW: This is your LIVE state. The table only updates when this changes!
  const [activeLayout, setActiveLayout] = useState({
    rowDims: [] as string[],
    colDims: [] as string[],
    measures: ['amount'] as string[]
  });

  const [includeAdjustments, setIncludeAdjustments] = useState(true);
  const [showVariance, setShowVariance] = useState(false);
  const [datasetLayout, setDatasetLayout] = useState<'col' | 'row'>('col');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsMeasure, setActiveSettingsMeasure] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  // NEW: Template State
  // NEW: Template State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // UPDATED: Fetch Templates Function (now accepts an isInitialLoad flag)
  const fetchTemplates = useCallback(async (isInitialLoad = false) => {
    if (!token) return;
    try {
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const fetchedTemplates = json.data || [];
        setTemplates(fetchedTemplates);

        // AUTO-LOAD LOGIC: Only apply automatically on the very first load
        if (isInitialLoad) {
          const defaultTemplate = fetchedTemplates.find((t: any) => t.isDefault);
          if (defaultTemplate && dragDropState.applyLayout) {
            setSelectedTemplateId(defaultTemplate.id);
            dragDropState.applyLayout(
              defaultTemplate.rowDimensions, 
              defaultTemplate.colDimensions, 
              defaultTemplate.measures
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to load templates", error);
    }
  }, [token, dragDropState]); // Added dragDropState to dependencies

  // UPDATED: Pass 'true' so the auto-load only happens when the dashboard first opens
  useEffect(() => {
    fetchTemplates(true);
  }, [fetchTemplates]);

  // Handle applying the selected template manually from the dropdown
  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (template && dragDropState.applyLayout) {
      
      // 1. Update the Draft State (for the Drawer)
      dragDropState.applyLayout(template.rowDimensions, template.colDimensions, template.measures);
      
      // 2. Update the Live State (for the Matrix)
      setActiveLayout({
        rowDims: template.rowDimensions || [],
        colDims: template.colDimensions || [],
        measures: template.measures || ['amount']
      });
    }
  };

  const [selectedCell, setSelectedCell] = useState<{ value: number; coordinates: Record<string, string>; datasetId: string; } | null>(null);
  const [isAdminPopoverOpen, setIsAdminPopoverOpen] = useState(false);
  const toggleDataset = (ds: string) => {
    setDatasetIds(prev => prev.includes(ds) ? prev.filter(id => id !== ds) : [...prev, ds]);
  };

  // History states
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!token) return setWorkspaceStatus('auth_error');

    const initWorkspace = async () => {
      try {
        const headers: HeadersInit = { 'Authorization': `Bearer ${token}` };
        const [dsRes, dimRes] = await Promise.all([fetch('/api/datasets', { headers }), fetch('/api/dimensions', { headers })]);

        if (!dsRes.ok || !dimRes.ok) throw new Error('API Error');

        const [dsJson, dimJson] = await Promise.all([dsRes.json(), dimRes.json()]);
        const dimArray = typeof dimJson.data === 'string' ? JSON.parse(dimJson.data) : dimJson.data;
        const dsArray = typeof dsJson.data === 'string' ? JSON.parse(dsJson.data) : dsJson.data;

        if (dimArray?.length > 0) setAvailableDimensions(dimArray.map((d: any) => ({ id: d.dim_id, label: d.dim_name })));
        if (dsArray?.length > 0) {
          setAvailableDatasets(dsArray);
          setDatasetIds([dsArray[0]]);
          setWorkspaceStatus('ready');
        } else {
          setWorkspaceStatus('empty');
        }
      } catch (error) {
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

  const activeDimensions = Array.from(new Set([...activeLayout.rowDims, ...activeLayout.colDims]));

  const { data, isLoading, error, refetch } = usePivotData({
    datasetIds,
    dimensions: activeDimensions,
    measures: activeLayout.measures,
    filters: {}, 
    includeAdjustments 
  });

  // --- RESTORED: Simulation History & Undo Logic ---
  const fetchHistory = useCallback(async () => {
    if (!datasetIds.length || !token) return; // Wait for token
    setIsHistoryLoading(true);
    try {
      // Pass the token!
      const historyData = await simulationService.getHistory(datasetIds[0], token); 
      setHistory(historyData);
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [datasetIds, token]);

  const handleUndo = async (timestampId: string) => {
    if (!window.confirm("Are you sure you want to undo this simulation?")) return;
    try {
      // Pass the token!
      await simulationService.undoAdjustment(datasetIds[0], timestampId, token!);
      refetch(); 
    } catch (error) {
      alert("Failed to undo simulation.");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, data]); 



  const resolveDim = (id: string) => availableDimensions.find(d => d.id === id) || { id, label: id };
  const resolveMeasure = (id: string) => AVAILABLE_MEASURES.find(m => m.id === id) || { id, label: id };

  if (workspaceStatus === 'loading' || isAuthLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 p-4">

<div className="flex flex-col gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Financial Overview</h1>
            <p className="text-sm text-gray-500 mt-1">Comparing {datasetIds.length} dataset(s)</p>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* 1. Load Template Dropdown */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">View:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="text-sm border border-gray-300 rounded-md py-1.5 pl-2 pr-8 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
              >
                <option value="">-- Custom --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Global Adjustments Toggle */}
            <div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Include Adjustments
              </span>
              <button
                type="button"
                onClick={() => setIncludeAdjustments(!includeAdjustments)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeAdjustments ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeAdjustments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. User Analysis Tools */}
            {/* 3. User Analysis Tools */}
            <button 
              onClick={() => {
                // FORCE SYNC: Make the drawer exactly match the live matrix before opening
                dragDropState.applyLayout(activeLayout.rowDims, activeLayout.colDims, activeLayout.measures);
                setIsDrawerOpen(true);
              }} 
              className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>📊</span> Customize Layout
            </button>

            {/* 4. Admin Setup Tools */}
            <button 
              onClick={() => setIsAdminPopoverOpen(true)} 
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors flex items-center gap-2"
            >
              <span>⚙️</span> Admin Workspace
            </button>
            
            {/* 5. Refresh Button */}
            <button 
              onClick={refetch} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Full-width Matrix Area */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto min-h-[500px] relative">
            {/* ... your loading spinner ... */}
            <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <PivotTable 
                data={data}
                // THESE MUST POINT TO activeLayout, NOT dragDropState!
                rowDimensions={activeLayout.rowDims}
                colDimensions={activeLayout.colDims}
                measures={activeLayout.measures}
                dimensionMap={dimensionMap}
                isLoading={false} 
                error={error}
                showVariance={showVariance}  
                datasetIds={datasetIds}    
                datasetDirection={datasetLayout}
                onCellClick={(value, coordinates) => setSelectedCell({ value, coordinates, datasetId: coordinates.datasetId || datasetIds[0] })}
              />
            </div>
          </div>

          {/* Simulation History Panel stays at the bottom */}
          <SimulationHistoryPanel history={history} onUndo={handleUndo} isLoading={isHistoryLoading} />
        </div>
      </div>
      
      {/* RESTORED: Settings Modal */}
      <PivotSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        measureLabel={dimensionMap[activeSettingsMeasure || ''] || 'Value'}
        availableDatasets={availableDatasets}
        datasetIds={datasetIds}
        toggleDataset={toggleDataset}
        datasetLayout={datasetLayout}
        setDatasetLayout={setDatasetLayout}
        includeAdjustments={includeAdjustments}
        setIncludeAdjustments={setIncludeAdjustments}
        showVariance={showVariance}
        setShowVariance={setShowVariance}
      />

      {/* RESTORED: Adjustment Popover */}
      {selectedCell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <AdjustmentPopover 
            cellData={selectedCell} 
            authToken={token!} // <--- Add this prop
            onClose={() => setSelectedCell(null)} 
            onSuccess={() => { refetch(); setSelectedCell(null); }} 
          />
        </div>
      )}

      <AdminTemplatePopover 
        isOpen={isAdminPopoverOpen}
        onClose={() => setIsAdminPopoverOpen(false)}
        onSaveTemplate={async (templateParams) => {
          try {
            // 1. Package the current Drag & Drop state into the payload
            const payload = {
              templateName: templateParams.name,
              description: templateParams.description,
              isDefault: templateParams.isDefault,
              rowDimensions: dragDropState.rowDims,
              colDimensions: dragDropState.colDims,
              measures: dragDropState.measures,
              filters: {} // You can hook up your active filters here later!
            };

            // 2. Send it to your new Node backend endpoint
            const res = await fetch('/api/templates', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save template');
            
            alert(`Template "${templateParams.name}" saved successfully!`);
            fetchTemplates(); // Force the dropdown to grab the new template!
            setIsAdminPopoverOpen(false);
            
          } catch (error) {
            console.error("Error saving template:", error);
            alert("Failed to save template. Check the console.");
          }
        }}
      />
      <ConfigurationDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCancel={() => {
          // If they cancel, revert the drawer's draft state back to whatever the live matrix currently looks like!
          dragDropState.applyLayout(activeLayout.rowDims, activeLayout.colDims, activeLayout.measures);
          setIsDrawerOpen(false);
        }}
        onApply={() => {
          // If they apply, push the drawer's draft state into the live matrix!
          setActiveLayout({
            rowDims: dragDropState.rowDims,
            colDims: dragDropState.colDims,
            measures: dragDropState.measures
          });
          setIsDrawerOpen(false);
        }}
        dragDropState={dragDropState}
        availableDimensions={availableDimensions}
        availableMeasures={AVAILABLE_MEASURES}
        resolveDim={resolveDim}
        resolveMeasure={resolveMeasure}
        onMeasureSettingsClick={(id) => { setActiveSettingsMeasure(id); setIsSettingsModalOpen(true); }}
      />
    </div>
  );
};

export default DashboardPage;
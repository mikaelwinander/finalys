//finalys-app/frontend/src/pages/DashboardPage.tsx

import { type FC, useState, useEffect, useMemo, useCallback } from 'react';

//import { AdminTemplatePopover } from '../components/PivotTable/AdminTemplatePopover';
import { AdjustmentPopover } from '../components/analytics/AdjustmentPopover';
import { SimulationHistoryPanel } from '../components/analytics/SimulationHistoryPanel';
import { usePivotData } from '../hooks/usePivotData';
import { usePivotDragDrop } from '../hooks/usePivotDragDrop';
import { PivotTable } from '../components/PivotTable/PivotTable';
//import { PivotDropZones } from '../components/PivotTable/PivotDropZones';
//import { DraggableCard } from '../components/PivotTable/DraggableCard';
import { useAuth } from '../hooks/useAuth'; 
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

  const dragDropState = usePivotDragDrop();

  // NEW: This is your LIVE state. The table only updates when this changes!
  const [activeLayout, setActiveLayout] = useState({
    rowDims: [] as string[],
    colDims: [] as string[],
    filterDims: [] as string[], // <-- NEW!
    measures: ['amount'] as string[],
    dimensionSettings: {} as Record<string, any> // <-- NEW!
  });

  const [includeAdjustments, setIncludeAdjustments] = useState(true);
  const [showVariance, setShowVariance] = useState(false);
  const [datasetLayout, setDatasetLayout] = useState<'col' | 'row'>('col');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsMeasure] = useState<string | null>(null);

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
  }, [token]); // Added dragDropState to dependencies

  // UPDATED: Pass 'true' so the auto-load only happens when the dashboard first opens
  useEffect(() => {
    fetchTemplates(true);
  }, [fetchTemplates]);

  // Save the current layout as a brand new template
  const handleSaveAsNewTemplate = async () => {
    const newName = window.prompt("Enter a name for your new template:");
    if (!newName) return; // User clicked cancel or left it blank

    try {
      const payload = {
        templateName: newName,
        rowDimensions: activeLayout.rowDims,
        colDimensions: activeLayout.colDims,
        measures: activeLayout.measures,
        filters: {} // Ready for the future!
      };

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save new template');
      
      const data = await res.json();
      
      // Refresh the dropdown and immediately select the newly created template!
      fetchTemplates(); 
      setSelectedTemplateId(data.templateId);
      
    } catch (error) {
      console.error("Error saving new template:", error);
      alert("Failed to save template. Check the console.");
    }
  };

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
        filterDims: [],          // <-- ADDED THIS to satisfy TypeScript!
        measures: template.measures || ['amount'],
        dimensionSettings: {}    // <-- ADDED THIS to satisfy TypeScript!
      });
    }
  };

  // Overwrite the currently selected template with the active layout
  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      const payload = {
        rowDimensions: activeLayout.rowDims,
        colDimensions: activeLayout.colDims,
        measures: activeLayout.measures,
        filters: {} // Ready for Step 2!
      };

      const res = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to update template');
      
      alert("Template layout updated successfully!");
      fetchTemplates(); // Refresh to ensure data is perfectly in sync
      
    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template. Check the console.");
    }
  };

  // Handle renaming the currently selected template
  const handleRenameTemplate = async () => {
    if (!selectedTemplateId) return;

    // Find the current template so we can show its existing name in the prompt
    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const currentName = currentTemplate?.name || '';

    // Pop up a native browser input box asking for the new name
    const newName = window.prompt("Enter a new name for this template:", currentName);

    // If they hit cancel, or didn't change the name, just stop here
    if (!newName || newName === currentName) return;

    try {
      // Notice we include the layout data too! Your backend controller 
      // strictly requires rowDimensions, colDimensions, and measures to be present.
      const payload = {
        templateName: newName,
        rowDimensions: activeLayout.rowDims,
        colDimensions: activeLayout.colDims,
        measures: activeLayout.measures,
        filters: {} 
      };

      const res = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to rename template');
      
      // Refresh the templates list so the dropdown immediately shows the new name!
      fetchTemplates(); 
      
    } catch (error) {
      console.error("Error renaming template:", error);
      alert("Failed to rename template. Check the console.");
    }
  };

  // Handle deleting the currently selected template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;
    
    // Add a quick safeguard so users don't accidentally delete their work!
    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!res.ok) throw new Error('Failed to delete template');

      // 1. Refresh the dropdown list from the backend
      fetchTemplates(); 
      // 2. Reset the dropdown back to "-- Custom --"
      setSelectedTemplateId(''); 
      
    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template. Check the console.");
    }
  };

  const [selectedCell, setSelectedCell] = useState<{ value: number; coordinates: Record<string, string>; datasetId: string; } | null>(null);
  //const [isAdminPopoverOpen, setIsAdminPopoverOpen] = useState(false);
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

  // --- RESTORED: Simulation History & Undo Logic (Using API Proxy!) ---
  const fetchHistory = useCallback(async () => {
    if (!datasetIds.length || !token) return; // Wait for token and dataset
    setIsHistoryLoading(true);
    try {
      // 1. Ask Express for the history data instead of BigQuery directly
      const response = await fetch(`/api/adjustments?datasetId=${datasetIds[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Pass Firebase auth token
        }
      });

      if (!response.ok) throw new Error('Failed to fetch history from API');
      
      const json = await response.json();
      // Handle both { data: [...] } format or direct array format from your backend
      setHistory(json.data || json || []); 
      
    } catch (error) {
      console.error("Failed to load history", error);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [datasetIds, token]);

  const handleUndo = async (timestampId: string) => {
    if (!window.confirm("Are you sure you want to undo this simulation?")) return;
    try {
      // 2. Ask Express to delete the adjustment by its timestamp ID
      const response = await fetch(`/api/adjustments/${timestampId}?datasetId=${datasetIds[0]}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to undo simulation via API');
      
      refetch(); // Refresh the main Pivot Table
      fetchHistory(); // Refresh the History Panel
      
    } catch (error) {
      console.error("Undo error:", error);
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
{/* 1. Load Template Dropdown & Management Icons */}
<div className="flex items-center gap-2 pr-4 border-r border-gray-300">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">View:</span>
              
              <div className="flex items-center gap-1">
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

                {/* ➕ Save As New (Always visible so they can save Custom layouts) */}
                <button
                  onClick={handleSaveAsNewTemplate}
                  className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition-colors border border-transparent hover:border-indigo-200"
                  title="Save as New Template"
                >
                  ➕
                </button>

                {/* 💾 Save Overwrite Button */}
                {selectedTemplateId && (
                  <button
                    onClick={handleUpdateTemplate}
                    className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200"
                    title="Overwrite Template Layout"
                  >
                    💾
                  </button>
                )}

                {/* ✏️ Rename Button */}
                {selectedTemplateId && (
                  <button
                    onClick={handleRenameTemplate}
                    className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors border border-transparent hover:border-green-200"
                    title="Rename Template"
                  >
                    ✏️
                  </button>
                )}

                {/* 🗑️ Delete Button */}
                {selectedTemplateId && (
                  <button
                    onClick={handleDeleteTemplate}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
                    title="Delete Template"
                  >
                    🗑️
                  </button>
                )}
              </div>
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
            <button 
              onClick={() => {
                // FORCE SYNC: Make the drawer exactly match the live matrix before opening
                dragDropState.applyLayout(activeLayout.rowDims, activeLayout.colDims, activeLayout.measures);
                setIsDrawerOpen(true); // <--- WE ADDED THIS BACK!
              }} 
              className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>📊</span> Layout
            </button>

            {/* 4. Admin Setup Tools */}
            
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
      {/* RESTORED: Configuration Drawer */}
{/* RESTORED: Configuration Drawer */}
<ConfigurationDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCancel={() => {
          // Revert draft state back to live state on cancel (Notice we added the 4th parameter for settings!)
          dragDropState.applyLayout(
            activeLayout.rowDims, 
            activeLayout.colDims, 
            activeLayout.measures, 
            activeLayout.dimensionSettings
          );
          setIsDrawerOpen(false);
        }}
        onApply={() => {
          // Push draft state into the live active layout!
          setActiveLayout({
            rowDims: dragDropState.rowDims,
            colDims: dragDropState.colDims,
            filterDims: dragDropState.filterDims,           // <-- NEW!
            measures: dragDropState.measures,
            dimensionSettings: dragDropState.dimensionSettings // <-- NEW!
          });
          setIsDrawerOpen(false);
        }}
        dragDropState={dragDropState}
        availableDimensions={availableDimensions}
        resolveDim={resolveDim}
        resolveMeasure={resolveMeasure}
      />
    </div>
  );
};

export default DashboardPage;
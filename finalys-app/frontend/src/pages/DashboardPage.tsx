// /frontend/src/pages/DashboardPage.tsx

import { type FC, useState, useEffect, useMemo, useCallback, useRef } from 'react';

import { AdjustmentPopover } from '../components/analytics/AdjustmentPopover';
import { SimulationHistoryPanel } from '../components/analytics/SimulationHistoryPanel';
import { usePivotData } from '../hooks/usePivotData';
import { usePivotDragDrop } from '../hooks/usePivotDragDrop';
import { PivotTable } from '../components/PivotTable/PivotTable';
import { useAuth } from '../hooks/useAuth';
import { PivotSettingsModal } from '../components/PivotTable/PivotSettingsModal';
import { ConfigurationDrawer } from '../components/PivotTable/ConfigurationDrawer';
import { Popover } from '../components/common/Popover';

// Centralized Assets & Layout
import { PageContainer } from '../components/Layout/PageContainer';
import { Button } from '../components/common/Button';
import { Icon } from '../components/common/Icon';
import { Spinner } from '../components/common/Spinner';

const AVAILABLE_MEASURES = [{ id: 'amount', label: 'Amount (Sum)' }];
const FALLBACK_DIMENSIONS = [
  { id: 'period_id', label: 'Period' },
  { id: 'amount_type_id', label: 'Amount Type' },
  { id: 'dim01', label: 'Dim 01' },
];

const DashboardPage: FC = () => {
  // ---------------------------------------------------------------------------
  // 1. ALL HOOKS MUST LIVE HERE AT THE TOP (Before any early returns)
  // ---------------------------------------------------------------------------
  const hasAppliedDefault = useRef(false);
  const { token, isLoading: isAuthLoading } = useAuth();
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetIds, setDatasetIds] = useState<string[]>([]);
  const [availableDimensions, setAvailableDimensions] = useState<{ id: string, label: string }[]>(FALLBACK_DIMENSIONS);
  const [workspaceStatus, setWorkspaceStatus] = useState<'loading' | 'ready' | 'empty' | 'auth_error' | 'api_error'>('loading');

  const dragDropState = usePivotDragDrop();

  const [activeLayout, setActiveLayout] = useState({
    rowDims: [] as string[],
    colDims: [] as string[],
    filterDims: [] as string[],
    measures: ['amount'] as string[],
    dimensionSettings: {} as Record<string, any>
  });

  const [includeAdjustments, setIncludeAdjustments] = useState(true);
  const [showVariance, setShowVariance] = useState(false);
  const [datasetLayout, setDatasetLayout] = useState<'col' | 'row'>('col');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeSettingsMeasure] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Template State
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  // Staged View Selection State (Safely at the top!)
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [stagedTemplateId, setStagedTemplateId] = useState<string | null>(null);

  const [selectedCell, setSelectedCell] = useState<{ value: number; coordinates: Record<string, string>; datasetId: string; } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // 2. EFFECTS AND CALLBACKS
  // ---------------------------------------------------------------------------
  const fetchTemplates = useCallback(async (isInitialLoad = false) => {
    if (!token) return;
    try {
      const res = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const json = await res.json();
        
        // 🚨 CRITICAL FIX: Parse the payload if the backend returned a string
        const fetchedTemplates = typeof json.data === 'string' 
          ? JSON.parse(json.data) 
          : (json.data || []);
          
        setTemplates(fetchedTemplates);

        if (isInitialLoad && !hasAppliedDefault.current) {
          const defaultTemplate = fetchedTemplates.find((t: any) => t.isDefault);
          if (defaultTemplate && dragDropState.applyLayout) {
            setSelectedTemplateId(defaultTemplate.id);
            dragDropState.applyLayout(
              defaultTemplate.rowDimensions,
              defaultTemplate.colDimensions,
              defaultTemplate.measures
            );
            hasAppliedDefault.current = true; 
          }
        }
      }
    } catch (error) {
      console.error("Failed to load templates", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    fetchTemplates(true);
  }, [fetchTemplates]);

  const handleSaveAsNewTemplate = async () => {
    const newName = window.prompt("Enter a name for your new template:");
    if (!newName) return; 

    try {
      const payload = {
        templateName: newName,
        rowDimensions: activeLayout.rowDims,
        colDimensions: activeLayout.colDims,
        measures: activeLayout.measures,
        filters: {} 
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
      fetchTemplates();
      setSelectedTemplateId(data.templateId);

    } catch (error) {
      console.error("Error saving new template:", error);
      alert("Failed to save template. Check the console.");
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find(t => t.id === templateId);
    if (template && dragDropState.applyLayout) {
      dragDropState.applyLayout(template.rowDimensions, template.colDimensions, template.measures);
      setActiveLayout({
        rowDims: template.rowDimensions || [],
        colDims: template.colDimensions || [],
        filterDims: [], 
        measures: template.measures || ['amount'],
        dimensionSettings: {} 
      });
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      const payload = {
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

      if (!res.ok) throw new Error('Failed to update template');

      alert("Template layout updated successfully!");
      fetchTemplates(); 

    } catch (error) {
      console.error("Error updating template:", error);
      alert("Failed to update template. Check the console.");
    }
  };

  const handleRenameTemplate = async () => {
    if (!selectedTemplateId) return;

    const currentTemplate = templates.find(t => t.id === selectedTemplateId);
    const currentName = currentTemplate?.name || '';
    const newName = window.prompt("Enter a new name for this template:", currentName);

    if (!newName || newName === currentName) return;

    try {
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
      fetchTemplates();

    } catch (error) {
      console.error("Error renaming template:", error);
      alert("Failed to rename template. Check the console.");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;

    if (!window.confirm("Are you sure you want to delete this template?")) return;

    try {
      const res = await fetch(`/api/templates/${selectedTemplateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to delete template');
      
      fetchTemplates();
      setSelectedTemplateId('');

    } catch (error) {
      console.error("Error deleting template:", error);
      alert("Failed to delete template. Check the console.");
    }
  };

  const toggleDataset = (ds: string) => {
    setDatasetIds(prev => prev.includes(ds) ? prev.filter(id => id !== ds) : [...prev, ds]);
  };

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

  const fetchHistory = useCallback(async () => {
    if (!datasetIds.length || !token) return; 
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`/api/adjustments?datasetId=${datasetIds[0]}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });

      if (!response.ok) throw new Error('Failed to fetch history from API');

      const json = await response.json();
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
      const response = await fetch(`/api/adjustments/${timestampId}?datasetId=${datasetIds[0]}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to undo simulation via API');

      refetch(); 
      fetchHistory(); 

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

// ---------------------------------------------------------------------------
  // 3. EARLY RETURNS (Must happen AFTER all hooks are declared)
  // ---------------------------------------------------------------------------
  if (workspaceStatus === 'loading' || isAuthLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  // 🚨 ADD THIS: Graceful fallback for API Timeouts/Failures
  if (workspaceStatus === 'api_error') {
    return (
      <PageContainer title="System Error" description="Connection Timeout">
        <div className="flex flex-col items-center justify-center h-64 mt-8 p-8 border border-dashed border-destructive bg-destructive/5 rounded-lg text-center">
          <h3 className="text-lg font-bold text-destructive mb-2">Backend API Unreachable</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            The dashboard failed to load because the API took too long to respond (504 Gateway Timeout). 
            Please verify that your Node.js backend server is actively running in your terminal.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <Icon name="refresh" size={16} className="mr-2" />
            Retry Connection
          </Button>
        </div>
      </PageContainer>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. RENDER PREPARATION
  // ---------------------------------------------------------------------------
  const activeTemplate = templates.find(t => t.id === selectedTemplateId);
  const currentViewName = activeTemplate ? activeTemplate.name : 'Custom Layout';

  // The dropdown content mapping
  // ---------------------------------------------------------------------------
  // 4. RENDER PREPARATION
  // ---------------------------------------------------------------------------
  // 🚨 CRITICAL FIX: Guarantee we are working with an array before rendering
  const safeTemplates = Array.isArray(templates) ? templates : [];
  
  // The dropdown content mapping
  const ViewMenuContent = (
    <div className="flex flex-col w-48 py-1">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border uppercase tracking-wider">
        Select View
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          // Apply immediately and close the menu
          handleApplyTemplate('');
          setIsViewMenuOpen(false);
        }}
        className={`w-full justify-start px-3 py-2 text-sm transition-colors ${
          selectedTemplateId === '' 
            ? 'bg-interactive-muted text-interactive font-medium' 
            : 'text-interactive hover:bg-interactive-muted hover:text-interactive-hover'
        }`}
      >
        Custom Layout
      </Button>
      {safeTemplates.map(t => (
        <Button
          key={t.id}
          variant="ghost"
          size="sm"
          onClick={() => {
            // Apply immediately and close the menu
            handleApplyTemplate(t.id);
            setIsViewMenuOpen(false);
          }}
          className={`w-full justify-start px-3 py-2 text-sm transition-colors ${
            selectedTemplateId === t.id 
              ? 'bg-interactive-muted text-interactive font-medium' 
              : 'text-interactive hover:bg-interactive-muted hover:text-interactive-hover'
          }`}
        >
          {t.name}
        </Button>
      ))}
    </div>
  );

  return (
    <PageContainer 
      title="Views" 
      description={currentViewName}
    >
      <div className="flex flex-col h-full space-y-6">
        
        {/* Unified Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border">
          
          <div className="flex items-center gap-4">
            
            {/* Template Actions and View Selector grouped together */}
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              
              <Popover 
                isOpen={isViewMenuOpen}
                // Now onOpenChange only needs to manage the visibility state
                onOpenChange={setIsViewMenuOpen}
                trigger={
                  <Button 
                    variant="primary" 
                    size="sm"
                    className="flex items-center justify-center px-2 mr-1"
                    title="Select View"
                  >
                    <Icon name="chevronDown" size={16} />
                  </Button>
                }
                content={ViewMenuContent}
                align="left"
              />

              <Button variant="ghost" size="sm" onClick={handleSaveAsNewTemplate} title="Save as New Template" className="px-2 text-interactive hover:text-interactive-hover hover:bg-interactive-muted">
                <Icon name="add" size={16} />
              </Button>

              {selectedTemplateId && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleUpdateTemplate} title="Overwrite Template Layout" className="px-2 text-interactive hover:text-interactive-hover hover:bg-interactive-muted">
                    <Icon name="save" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRenameTemplate} title="Rename Template" className="px-2 text-interactive hover:text-interactive-hover hover:bg-interactive-muted">
                    <Icon name="edit" size={16} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeleteTemplate} title="Delete Template" className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Icon name="trash" size={16} />
                  </Button>
                </>
              )}
            </div>

            {/* Adjustments Toggle */}
            <div className="flex items-center gap-2 pr-4 border-r border-border">
              <span className="text-sm font-medium text-foreground">
                Include Adjustments
              </span>
              <button
                type="button"
                onClick={() => setIncludeAdjustments(!includeAdjustments)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive focus-visible:ring-offset-2 ${
                  includeAdjustments ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${
                    includeAdjustments ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Values Configuration Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <Icon name="settings" size={16} className="mr-2" />
              Values
            </Button>

            {/* Layout Configuration Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                dragDropState.applyLayout(activeLayout.rowDims, activeLayout.colDims, activeLayout.measures);
                setIsDrawerOpen(true);
              }}
            >
              <Icon name="table" size={16} className="mr-2" />
              Layout
            </Button>
          </div>

          {/* Refresh Button */}
          <Button variant="primary" size="sm" onClick={refetch}>
            <Icon name="refresh" size={16} className="mr-2" />
            Refresh Data
          </Button>

        </div>

        {/* Matrix Area */}
        <div className="flex-1 flex flex-col min-w-0 space-y-4">
          <div className="bg-surface border border-border rounded-lg p-4 shadow-sm overflow-x-auto min-h-[500px] relative">
            <div className={`transition-opacity duration-200 ${isLoading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
              <PivotTable
                data={data}
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

          {/* Simulation History Panel */}
          <SimulationHistoryPanel history={history} onUndo={handleUndo} isLoading={isHistoryLoading} />
        </div>
      </div>

      {/* Settings Modal */}
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

      {/* Adjustment Popover */}
      {selectedCell && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 backdrop-blur-sm">
          <AdjustmentPopover
            cellData={selectedCell}
            authToken={token!} 
            onClose={() => setSelectedCell(null)}
            onSuccess={() => { refetch(); setSelectedCell(null); }}
          />
        </div>
      )}

      {/* Configuration Drawer */}
      <ConfigurationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onCancel={() => {
          dragDropState.applyLayout(
            activeLayout.rowDims,
            activeLayout.colDims,
            activeLayout.measures,
            activeLayout.dimensionSettings
          );
          setIsDrawerOpen(false);
        }}
        onApply={() => {
          setActiveLayout({
            rowDims: dragDropState.rowDims,
            colDims: dragDropState.colDims,
            filterDims: dragDropState.filterDims, 
            measures: dragDropState.measures,
            dimensionSettings: dragDropState.dimensionSettings 
          });
          setIsDrawerOpen(false);
        }}
        dragDropState={dragDropState}
        availableDimensions={availableDimensions}
        resolveDim={resolveDim}
        resolveMeasure={resolveMeasure}
      />
    </PageContainer>
  );
};

export default DashboardPage;
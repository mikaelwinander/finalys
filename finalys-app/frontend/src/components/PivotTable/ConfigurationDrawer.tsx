// /frontend/src/components/PivotTable/ConfigurationDrawer.tsx
import React, { useState } from 'react';
import { PivotDropZones } from './PivotDropZones';
import { DraggableCard } from './DraggableCard';
import { type DimSettings, type VarianceDef, VALUES_VIRTUAL_DIM } from '../../hooks/usePivotDragDrop';
import { Button } from '../common/Button'; 
import { Icon } from '../common/Icon';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onCancel: () => void;
  dragDropState: any; 
  availableDimensions: { id: string; label: string }[];
  availableDatasets: string[]; 
  dimensionMap: Record<string, string>; // <-- NEW: For translation
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen, onClose, onApply, onCancel, dragDropState, 
  availableDimensions, availableDatasets, dimensionMap, resolveDim, resolveMeasure
}) => {
  const [activeSettingsDim, setActiveSettingsDim] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (dimId: string, settings: DimSettings) => {
    dragDropState.updateDimSetting(dimId, settings);
    setActiveSettingsDim(null);
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-7xl bg-surface rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">Workspace Configuration</h2>
            <p className="text-sm text-muted-foreground">Drag dimensions from the library to configure your matrix.</p>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground text-3xl leading-none transition-colors">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden bg-muted/50 relative">
          
          {/* LEFT PANE: Field Library */}
          <div className="w-80 border-r border-border bg-muted flex flex-col shadow-inner">
            <div className="p-4 border-b border-border bg-surface">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dimension Library</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div 
                className="min-h-[150px] p-2 bg-surface/50 border border-dashed border-border rounded-lg"
                onDragOver={dragDropState.handleDragOver} 
                onDrop={(e) => dragDropState.handleDrop(e, 'available')} 
              >
                <div className="space-y-2">
                  {availableDimensions.map((dim, i) => (
                    <DraggableCard 
                      key={dim.id} 
                      item={dim} 
                      zone="available" 
                      index={i} 
                      onDragStart={dragDropState.handleDragStart} 
                      onDragEnd={dragDropState.handleDragEnd} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: Active Canvas */}
          <div className="flex-1 overflow-y-auto p-8 bg-surface">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-bold text-foreground uppercase mb-6 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-interactive"></span>
                Active Matrix Layout
              </h3>
              
              <div className="bg-muted border border-border rounded-xl p-6 shadow-sm">
                <PivotDropZones 
                  {...dragDropState}
                  resolveDim={resolveDim}
                  resolveMeasure={resolveMeasure}
                  onDimClick={(dimId: string) => setActiveSettingsDim(dimId)}
                />
              </div>
            </div>
          </div>

          {/* DYNAMIC POPOVERS */}
          {activeSettingsDim && activeSettingsDim !== VALUES_VIRTUAL_DIM && (
            <DimensionSettingsPopover 
              dimId={activeSettingsDim}
              dimName={availableDimensions.find(d => d.id === activeSettingsDim)?.label || resolveMeasure(activeSettingsDim).label}
              currentSettings={dragDropState.dimensionSettings[activeSettingsDim]}
              onClose={() => setActiveSettingsDim(null)}
              onSave={handleSaveSettings}
            />
          )}

          {/* NEW: Dataset Virtual Token Popover */}
          {activeSettingsDim === VALUES_VIRTUAL_DIM && (
            <DatasetSettingsPopover 
              availableDatasets={availableDatasets}
              dimensionMap={dimensionMap}
              stagedDatasetIds={dragDropState.stagedDatasetIds}
              stagedVariances={dragDropState.stagedVariances}
              setStagedDatasetIds={dragDropState.setStagedDatasetIds}
              setStagedVariances={dragDropState.setStagedVariances}
              onClose={() => setActiveSettingsDim(null)}
            />
          )}

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted flex justify-end gap-3 z-10">
           <Button variant="outline" onClick={onCancel}>Cancel</Button>
           <Button variant="primary" onClick={onApply}>Apply & Update Matrix</Button>
        </div>
      </div>
    </div>
  );
};

// --- MINI POPOVER 1: Standard Dimension Settings ---
const DimensionSettingsPopover = ({ dimId, dimName, currentSettings, onClose, onSave }: any) => {
  const [settings, setSettings] = useState<DimSettings>(currentSettings || { display: 'name', sortField: 'name', sortDir: 'asc', showAllItems: false });
  return (
    <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface border border-border shadow-md rounded-lg p-6 w-96 animate-fade-in">
        <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Settings: {dimName}</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Display Format</label>
            <select 
              value={settings.display} 
              onChange={e => setSettings({...settings, display: e.target.value as any})}
              className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-2 focus:ring-interactive focus:border-interactive outline-none"
            >
              <option value="id">ID Only</option>
              <option value="name">Name Only</option>
              <option value="id-name">ID - Name</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Sort By</label>
              <select 
                value={settings.sortField} 
                onChange={e => setSettings({...settings, sortField: e.target.value as any})}
                className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-2 focus:ring-interactive focus:border-interactive outline-none"
              >
                <option value="id">ID</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-muted-foreground mb-1">Direction</label>
              <select 
                value={settings.sortDir} 
                onChange={e => setSettings({...settings, sortDir: e.target.value as any})}
                className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-2 focus:ring-interactive focus:border-interactive outline-none"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-semibold text-foreground">Show items with no data</label>
                <p className="text-xs text-muted-foreground mt-0.5">Force all dimension values to appear in the matrix.</p>
              </div>
              <button
                type="button"
                onClick={() => setSettings({...settings, showAllItems: !settings.showAllItems})}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-interactive focus-visible:ring-offset-2 ${settings.showAllItems ? 'bg-interactive' : 'bg-muted border-border'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface shadow-sm ring-0 transition duration-200 ease-in-out ${settings.showAllItems ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
          <Button variant="primary" onClick={() => onSave(dimId, settings)} size="sm">Save Configuration</Button>
        </div>
      </div>
    </div>
  );
};

// --- MINI POPOVER 2: Dataset Configuration (UPGRADED) ---
const DatasetSettingsPopover = ({ 
  availableDatasets, dimensionMap, stagedDatasetIds, stagedVariances, 
  setStagedDatasetIds, setStagedVariances, onClose 
}: any) => {
  const [searchTerm, setSearchTerm] = useState('');

  const toggleDataset = (ds: string) => {
    setStagedDatasetIds((prev: string[]) => prev.includes(ds) ? prev.filter(id => id !== ds) : [...prev, ds]);
  };

  const addVariance = () => {
    setStagedVariances((prev: VarianceDef[]) => [...prev, { base: '', compare: '' }]);
  };

  const updateVariance = (index: number, field: 'base' | 'compare', value: string) => {
    setStagedVariances((prev: VarianceDef[]) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  const removeVariance = (index: number) => {
    setStagedVariances((prev: VarianceDef[]) => prev.filter((_, i) => i !== index));
  };

  // Filter datasets based on human-readable name
  const filteredDatasets = availableDatasets.filter((ds: string) => {
    const name = dimensionMap[ds] || ds;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface border border-emerald-300 shadow-xl rounded-lg flex flex-col w-[500px] max-h-full animate-fade-in">
        
        <div className="p-5 border-b border-emerald-100 shrink-0">
          <h3 className="font-bold text-emerald-800 flex items-center gap-2">
            <Icon name="calculator" size={18} /> ∑ Datasets Configuration
          </h3>
          <p className="text-xs text-emerald-700/80 mt-1">Select datasets and configure custom variance columns.</p>
        </div>
        
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* SEARCHABLE DATASETS */}
          <div className="border border-border rounded-md overflow-hidden bg-surface shadow-sm flex flex-col">
            <div className="bg-muted px-3 py-2 border-b border-border">
              <input 
                type="text" 
                placeholder="Search datasets..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
              {filteredDatasets.map((ds: string) => {
                const name = dimensionMap[ds] || ds;
                return (
                  <label key={ds} className="flex items-center gap-3 p-2 rounded-md hover:bg-interactive-muted/30 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={stagedDatasetIds.includes(ds)}
                      onChange={() => toggleDataset(ds)}
                      className="w-4 h-4 text-emerald-600 rounded border-border focus:ring-emerald-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{name}</span>
                      {name !== ds && <span className="text-[10px] text-muted-foreground">{ds}</span>}
                    </div>
                  </label>
                );
              })}
              {filteredDatasets.length === 0 && <p className="text-sm text-muted-foreground p-2">No datasets match your search.</p>}
            </div>
          </div>

          {/* VARIANCE BUILDER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-foreground">Custom Variances</h4>
              <Button variant="outline" size="sm" onClick={addVariance} className="text-xs py-1 h-7">
                <Icon name="add" size={14} className="mr-1" /> Add Variance
              </Button>
            </div>
            
            {stagedVariances.length === 0 && (
              <div className="text-xs text-muted-foreground italic bg-muted/50 p-3 rounded border border-dashed border-border text-center">
                No custom variances configured.
              </div>
            )}

            <div className="space-y-2">
              {stagedVariances.map((v: VarianceDef, idx: number) => (
                <div key={idx} className="flex items-center gap-2 bg-muted/30 p-2 rounded border border-border">
                  <select 
                    value={v.base} 
                    onChange={(e) => updateVariance(idx, 'base', e.target.value)}
                    className="flex-1 border border-border bg-surface text-foreground rounded p-1.5 text-xs outline-none focus:border-emerald-500 truncate"
                  >
                    <option value="" disabled>Select Base...</option>
                    {availableDatasets.map((ds: string) => (
                      <option key={ds} value={ds}>{dimensionMap[ds] || ds}</option>
                    ))}
                  </select>
                  <span className="text-muted-foreground font-bold text-lg leading-none shrink-0 mb-1">-</span>
                  <select 
                    value={v.compare} 
                    onChange={(e) => updateVariance(idx, 'compare', e.target.value)}
                    className="flex-1 border border-border bg-surface text-foreground rounded p-1.5 text-xs outline-none focus:border-emerald-500 truncate"
                  >
                    <option value="" disabled>Select Compare...</option>
                    {availableDatasets.map((ds: string) => (
                      <option key={ds} value={ds}>{dimensionMap[ds] || ds}</option>
                    ))}
                  </select>
                  <button onClick={() => removeVariance(idx)} className="text-muted-foreground hover:text-destructive shrink-0 p-1 transition-colors">
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-emerald-100 flex justify-end shrink-0 bg-surface rounded-b-lg">
          <Button variant="primary" onClick={onClose} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white border-none">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
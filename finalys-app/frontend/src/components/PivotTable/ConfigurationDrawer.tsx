import React, { useState } from 'react';
import { PivotDropZones } from './PivotDropZones';
import { DraggableCard } from './DraggableCard';
import { type DimSettings } from '../../hooks/usePivotDragDrop';
import { Button } from '../common/Button'; // Enforcing Rule 7: Centralized UI Primitives

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onCancel: () => void;
  dragDropState: any; 
  availableDimensions: { id: string; label: string }[];
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen, onClose, onApply, onCancel, dragDropState, availableDimensions, resolveDim, resolveMeasure
}) => {
  const [activeSettingsDim, setActiveSettingsDim] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveSettings = (dimId: string, settings: DimSettings) => {
    dragDropState.updateDimSetting(dimId, settings);
    setActiveSettingsDim(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
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
                  {/* dim.label already holds the human-readable names thanks to the API update! */}
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

          {activeSettingsDim && (
            <DimensionSettingsPopover 
              dimId={activeSettingsDim}
              dimName={
                availableDimensions.find(d => d.id === activeSettingsDim)?.label || 
                resolveMeasure(activeSettingsDim).label
              }
              currentSettings={dragDropState.dimensionSettings[activeSettingsDim]}
              onClose={() => setActiveSettingsDim(null)}
              onSave={handleSaveSettings}
            />
          )}

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted flex justify-end gap-3 z-10">
           {/* Enforced shared Button components instead of raw HTML buttons */}
           <Button variant="outline" onClick={onCancel}>Cancel</Button>
           <Button variant="primary" onClick={onApply}>Apply & Update Matrix</Button>
        </div>
      </div>
    </div>
  );
};

// --- MINI POPOVER COMPONENT ---
const DimensionSettingsPopover = ({ dimId, dimName, currentSettings, onClose, onSave }: any) => {
  const [settings, setSettings] = useState<DimSettings>(currentSettings || { display: 'name', sortField: 'name', sortDir: 'asc' });

  return (
    <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-surface border border-border shadow-md rounded-lg p-6 w-96">
        <h3 className="font-bold text-foreground mb-4 border-b border-border pb-2">Settings: {dimName}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Display Format</label>
            <select 
              value={settings.display} 
              onChange={e => setSettings({...settings, display: e.target.value as any})}
              className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-interactive focus:border-interactive outline-none"
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
                className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-interactive focus:border-interactive outline-none"
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
                className="w-full border border-border bg-surface text-foreground rounded p-2 text-sm focus:ring-interactive focus:border-interactive outline-none"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          {/* Enforced shared Button components */}
          <Button variant="ghost" onClick={onClose} size="sm">Cancel</Button>
          <Button variant="primary" onClick={() => onSave(dimId, settings)} size="sm">Save</Button>
        </div>
      </div>
    </div>
  );
};
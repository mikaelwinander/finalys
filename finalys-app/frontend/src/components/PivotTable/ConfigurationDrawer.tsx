import React, { useState } from 'react';
import { PivotDropZones } from './PivotDropZones';
import { DraggableCard } from './DraggableCard';
import { type DimSettings } from '../../hooks/usePivotDragDrop';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onCancel: () => void;
  dragDropState: any; 
  availableDimensions: { id: string; label: string }[];
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string }; // <-- ADD THIS!
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen, onClose, onApply, onCancel, dragDropState, availableDimensions, resolveDim, resolveMeasure // <-- ADD THIS!
}) => {
  // State for the new Dimension Settings Popover
  const [activeSettingsDim, setActiveSettingsDim] = useState<string | null>(null);

  if (!isOpen) return null;

  // Popover close/save handler
  const handleSaveSettings = (dimId: string, settings: DimSettings) => {
    dragDropState.updateDimSetting(dimId, settings);
    setActiveSettingsDim(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full h-full max-w-7xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Workspace Configuration</h2>
            <p className="text-sm text-gray-500">Drag dimensions from the library to configure your matrix.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden bg-gray-50/50 relative">
          
          {/* LEFT PANE: Field Library (Static Palette) */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col shadow-inner">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dimension Library</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div 
                className="min-h-[150px] p-2 bg-white/50 border border-dashed border-gray-300 rounded-lg"
                onDragOver={dragDropState.handleDragOver} 
                onDrop={(e) => dragDropState.handleDrop(e, 'available')} // Acts as a trash can for dropping back!
              >
                <div className="space-y-2">
                  {/* Notice we map ALL available dimensions, we no longer filter them out! */}
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
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-sm font-bold text-gray-800 uppercase mb-6 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Active Matrix Layout
              </h3>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm">
                <PivotDropZones 
                  {...dragDropState}
                  resolveDim={resolveDim}
                  resolveMeasure={resolveMeasure} // <-- ADD THIS!
                  onDimClick={(dimId: string) => setActiveSettingsDim(dimId)}
                />
              </div>
            </div>
          </div>


          {activeSettingsDim && (
            <DimensionSettingsPopover 
              dimId={activeSettingsDim}
              // Check if it's a dimension first, if not, check if it's a measure!
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
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 z-10">
           <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-sm font-medium">Cancel</button>
           <button onClick={onApply} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 text-sm font-medium">Apply & Update Matrix</button>
        </div>
      </div>
    </div>
  );
};

// --- MINI POPOVER COMPONENT ---
const DimensionSettingsPopover = ({ dimId, dimName, currentSettings, onClose, onSave }: any) => {
  const [settings, setSettings] = useState<DimSettings>(currentSettings || { display: 'name', sortField: 'name', sortDir: 'asc' });

  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 shadow-xl rounded-lg p-6 w-96">
        <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Settings: {dimName}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Display Format</label>
            <select 
              value={settings.display} 
              onChange={e => setSettings({...settings, display: e.target.value as any})}
              className="w-full border rounded p-2 text-sm"
            >
              <option value="id">ID Only</option>
              <option value="name">Name Only</option>
              <option value="id-name">ID - Name</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Sort By</label>
              <select 
                value={settings.sortField} 
                onChange={e => setSettings({...settings, sortField: e.target.value as any})}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="id">ID</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Direction</label>
              <select 
                value={settings.sortDir} 
                onChange={e => setSettings({...settings, sortDir: e.target.value as any})}
                className="w-full border rounded p-2 text-sm"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
          <button onClick={() => onSave(dimId, settings)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};
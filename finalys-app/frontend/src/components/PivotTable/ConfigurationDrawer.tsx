import React from 'react';
import { PivotDropZones } from './PivotDropZones';
import { DraggableCard } from './DraggableCard';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;    // NEW
  onCancel: () => void;   // NEW
  dragDropState: any; 
  availableDimensions: { id: string; label: string }[];
  availableMeasures: { id: string; label: string }[];
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
  onMeasureSettingsClick: (id: string) => void;
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onCancel,
  dragDropState,
  availableDimensions,
  availableMeasures,
  resolveDim,
  resolveMeasure,
  onMeasureSettingsClick
}) => {
  if (!isOpen) return null;

  // Filter out dimensions that are already actively in use so the library stays clean!
  const activeDims = [...dragDropState.rowDims, ...dragDropState.colDims, ...dragDropState.filterDims];
  const unusedDimensions = availableDimensions.filter(dim => !activeDims.includes(dim.id));
  
  const unusedMeasures = availableMeasures.filter(m => !dragDropState.measures.includes(m.id));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Full Screen Modal Panel */}
      <div className="relative w-full h-full max-w-7xl bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white shadow-sm z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Workspace Configuration</h2>
            <p className="text-sm text-gray-500">Drag fields from the library onto the canvas to build your report.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl leading-none focus:outline-none">&times;</button>
        </div>

        {/* Two-Pane Body */}
        <div className="flex-1 flex overflow-hidden bg-gray-50/50">
          
          {/* LEFT PANE: Field Library */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col shadow-inner">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Field Library</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Unused Dimensions */}
              <div 
                className="min-h-[150px] p-2 bg-white/50 border border-dashed border-gray-300 rounded-lg"
                onDragOver={dragDropState.handleDragOver} 
                onDrop={(e) => dragDropState.handleDrop(e, 'available')}
              >
                <div className="text-xs font-semibold text-gray-400 mb-3 px-1">Dimensions</div>
                <div className="space-y-2">
                  {unusedDimensions.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-4">All dimensions in use</p>
                  )}
                  {unusedDimensions.map((dim, i) => (
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

              {/* Unused Measures */}
              <div 
                className="min-h-[100px] p-2 bg-white/50 border border-dashed border-gray-300 rounded-lg"
                onDragOver={dragDropState.handleDragOver} 
                onDrop={(e) => dragDropState.handleDrop(e, 'available')}
              >
                <div className="text-xs font-semibold text-gray-400 mb-3 px-1">Measures</div>
                <div className="space-y-2">
                  {unusedMeasures.length === 0 && (
                    <p className="text-xs text-gray-400 italic text-center py-2">All measures in use</p>
                  )}
                  {unusedMeasures.map((measure, i) => (
                    <DraggableCard 
                      key={measure.id} 
                      item={measure} 
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
                  resolveMeasure={resolveMeasure}
                  onMeasureSettingsClick={onMeasureSettingsClick}
                />
              </div>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 z-10">
           <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium focus:outline-none">
             Cancel
           </button>
           <button onClick={onApply} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors text-sm font-medium focus:outline-none">
             Apply & Update Matrix
           </button>
        </div>

      </div>
    </div>
  );
};
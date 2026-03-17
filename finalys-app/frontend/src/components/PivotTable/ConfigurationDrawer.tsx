// frontend/src/components/PivotTable/ConfigurationDrawer.tsx
import React from 'react';
import { PivotDropZones } from './PivotDropZones';
import { DraggableCard } from './DraggableCard';

interface ConfigurationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  dragDropState: any; // Using any for fast prototyping, connects directly to your usePivotDragDrop hook
  availableDimensions: { id: string; label: string }[];
  availableMeasures: { id: string; label: string }[];
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
  onMeasureSettingsClick: (id: string) => void;
}

export const ConfigurationDrawer: React.FC<ConfigurationDrawerProps> = ({
  isOpen,
  onClose,
  dragDropState,
  availableDimensions,
  availableMeasures,
  resolveDim,
  resolveMeasure,
  onMeasureSettingsClick
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-gray-200 animate-slide-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Customize View</h2>
            <p className="text-xs text-gray-500">Drag and drop fields to adjust the pivot table</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        {/* Scrollable Configuration Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-gray-50/50">
          
          {/* Active Drop Zones */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 tracking-wider">Active Layout</h3>
            <PivotDropZones 
              {...dragDropState}
              resolveDim={resolveDim}
              resolveMeasure={resolveMeasure}
              onMeasureSettingsClick={onMeasureSettingsClick}
            />
          </div>

          <div className="h-px bg-gray-200" />

          {/* Available Dimensions */}
          <div 
            className="flex flex-col h-[300px] bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            onDragOver={dragDropState.handleDragOver} 
            onDrop={(e) => dragDropState.handleDrop(e, 'available')}
          >
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Available Dimensions</h3>
            <div className="overflow-y-auto pr-1 flex-1 space-y-2">
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

          {/* Available Measures */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 tracking-wider">Available Measures</h3>
            <div className="space-y-2">
              {availableMeasures.map((measure, i) => (
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
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex justify-end">
           <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors text-sm font-medium">
             Apply & Close
           </button>
        </div>
      </div>
    </div>
  );
};
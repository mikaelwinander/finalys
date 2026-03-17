import React, { useState } from 'react';
import type { PivotTemplate } from '../../types/pivot.types';

export interface AdminTemplatePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  availableDimensions: { id: string; label: string }[];
  onSaveTemplate: (template: Partial<PivotTemplate>) => Promise<void>;
}

export const AdminTemplatePopover: React.FC<AdminTemplatePopoverProps> = ({
  isOpen,
  onClose,
  availableDimensions,
  onSaveTemplate
}) => {
  const [templateName, setTemplateName] = useState('');
  const [allowedDims, setAllowedDims] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleToggleDim = (id: string) => {
    setAllowedDims(prev => 
      prev.includes(id) ? prev.filter(dimId => dimId !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!templateName.trim() || allowedDims.length === 0) {
      alert("Please provide a name and select at least one dimension.");
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTemplate({
        name: templateName,
        allowedDimensions: allowedDims,
        // Defaulting to basic measures for now; this can be expanded
        allowedMeasures: ['amount'], 
        defaultView: {
          rows: allowedDims.slice(0, 1), // Default first selected dim to rows
          columns: [],
          measures: ['amount']
        }
      });
      onClose();
    } catch (error) {
      console.error("Failed to save template", error);
      alert("Failed to save template.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Design New Pivot View</h2>
            <p className="text-xs text-gray-500 mt-1">Define the boundaries for end-user exploration.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">View Name</label>
            <input 
              type="text" 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Regional Sales Overview"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-gray-700">Allowed Dimensions</label>
              <span className="text-xs text-gray-400">{allowedDims.length} selected</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">Users will only be able to drag-and-drop the dimensions selected below. This protects database performance.</p>
            
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
              {availableDimensions.map((dim) => (
                <label key={dim.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors border border-transparent hover:border-gray-200">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={allowedDims.includes(dim.id)}
                    onChange={() => handleToggleDim(dim.id)}
                  />
                  <span className="text-sm text-gray-800 truncate" title={dim.label}>{dim.label}</span>
                </label>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-50 flex items-center"
          >
            {isSaving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
        
      </div>
    </div>
  );
};
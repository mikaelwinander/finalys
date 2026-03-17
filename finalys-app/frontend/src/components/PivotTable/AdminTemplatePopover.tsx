import React, { useState } from 'react';

export interface AdminTemplatePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  // We no longer need availableDimensions here, we just need the save function
  onSaveTemplate: (params: { name: string; description: string; isDefault: boolean }) => Promise<void>;
}

export const AdminTemplatePopover: React.FC<AdminTemplatePopoverProps> = ({
  isOpen,
  onClose,
  onSaveTemplate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a template name.');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSaveTemplate({ name, description, isDefault });
      
      // Reset form on success
      setName('');
      setDescription('');
      setIsDefault(false);
    } catch (error) {
      console.error("Failed to save template", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Save Admin Template</h2>
            <p className="text-xs text-gray-500 mt-1">Lock in the current matrix layout for your team.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Template Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Standard Monthly P&L"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-20 resize-none"
              placeholder="What is this layout best used for?"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <input 
              type="checkbox" 
              id="default-template"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="default-template" className="text-sm text-gray-700 cursor-pointer">
              Set as the default workspace layout for all users
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none disabled:opacity-70 flex items-center"
          >
            {isSaving ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>

      </div>
    </div>
  );
};
// /frontend/src/components/PivotTable/AdminTemplatePopover.tsx
import React, { useState } from 'react';
import { Button } from '../common/Button'; // <-- RULE #7: Reusing standard primitive
import { Icon } from '../common/Icon';     // <-- RULE #6: Reusing standard icon registry

export interface AdminTemplatePopoverProps {
  isOpen: boolean;
  onClose: () => void;
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
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-xl shadow-md w-full max-w-md overflow-hidden flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-foreground">Save Admin Template</h2>
            <p className="text-xs text-muted-foreground mt-1">Lock in the current matrix layout for your team.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors">
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Template Name *</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-border bg-surface text-foreground rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-interactive focus:border-interactive outline-none"
              placeholder="e.g., Standard Monthly P&L"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-border bg-surface text-foreground rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-interactive focus:border-interactive outline-none h-20 resize-none"
              placeholder="What is this layout best used for?"
            />
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <input 
              type="checkbox" 
              id="default-template"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="h-4 w-4 text-interactive border-border rounded focus:ring-interactive cursor-pointer"
            />
            <label htmlFor="default-template" className="text-sm text-foreground cursor-pointer font-medium">
              Set as the default workspace layout for all users
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Template'}
          </Button>
        </div>

      </div>
    </div>
  );
};
// /frontend/src/components/PivotTable/DraggableCard.tsx
import React, { useState } from 'react';
import { Icon } from '../common/Icon';

interface DraggableCardProps {
  item: { id: string; label: string };
  zone: string;
  index: number;
  onDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDropTarget?: (e: React.DragEvent, zone: string, index: number) => void;
  onClick?: () => void; // <-- ADDED
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ 
  item, zone, index, onDragStart, onDragEnd, onDropTarget, onClick 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const isMeasure = item.id === '__VALUES__' || zone === 'measure';
  
  const baseClasses = "flex items-center gap-2 px-3 py-2 rounded-md border shadow-sm cursor-grab active:cursor-grabbing transition-all";
  const colorClasses = isMeasure 
    ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300" 
    : "bg-interactive-muted/50 border-border text-foreground hover:border-interactive";

  const dropIndicator = isDragOver ? "border-t-2 border-t-interactive pt-3 -mt-1 shadow-md" : "";

  return (
    <div
      onClick={onClick} // <-- ADDED
      draggable
      onDragStart={(e) => onDragStart(e, item.id, zone, index)}
      onDragEnd={(e) => {
        setIsDragOver(false);
        onDragEnd(e);
      }}
      onDragOver={(e) => {
        if (onDropTarget) {
          e.preventDefault();
          setIsDragOver(true);
        }
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        if (onDropTarget) onDropTarget(e, zone, index);
      }}
      className={`${baseClasses} ${colorClasses} ${dropIndicator}`}
      title={`Drag to move ${item.label}`}
    >
      <div className="opacity-40 hover:opacity-100 transition-opacity flex items-center justify-center">
        <Icon name="grip" size={16} />
      </div>
      
      <span className="text-sm font-semibold truncate select-none">
        {item.label}
      </span>

      {isMeasure && item.id !== '__VALUES__' && (
        <div className="ml-auto opacity-50">
           <Icon name="settings" size={14} />
        </div>
      )}
    </div>
  );
};
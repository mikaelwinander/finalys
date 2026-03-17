import React from 'react';

interface DraggableCardProps {
  item: { id: string; label: string };
  zone: string;
  index: number;
  onDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ item, zone, index, onDragStart, onDragEnd }) => {
  
  // Differentiate styling based on if it's a measure or dimension
  const isMeasure = item.id === 'amount' || zone === 'measure';
  
  const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-md border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md transform hover:-translate-y-[1px]";
  
  // Subtly tint the pills based on their type to help the user distinguish them
  const colorClasses = isMeasure 
    ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-300" 
    : "bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-300";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, zone, index)}
      onDragEnd={onDragEnd}
      className={`${baseClasses} ${colorClasses}`}
      title={`Drag to move ${item.label}`}
    >
      {/* Premium Grip Icon */}
      <div className="flex flex-col gap-[2px] opacity-40">
        <div className="w-1 h-1 bg-current rounded-full"></div>
        <div className="w-1 h-1 bg-current rounded-full"></div>
        <div className="w-1 h-1 bg-current rounded-full"></div>
      </div>
      
      <span className="text-sm font-semibold truncate select-none">
        {item.label}
      </span>

      {/* Show a subtle gear icon if it's an active measure (hinting at settings) */}
      {zone === 'measure' && (
        <span className="ml-auto text-xs opacity-50">⚙️</span>
      )}
    </div>
  );
};
import React from 'react';

export interface DraggableCardProps {
  item: { id: string; label: string };
  zone: string;
  index: number;
  onDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onSettingsClick?: (id: string) => void;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  item,
  zone,
  index,
  onDragStart,
  onDragEnd,
  onSettingsClick
}) => {
  const isDroppedMeasure = zone === 'measure';

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id, zone, index)}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded p-2 mb-2 shadow-sm transition-colors flex items-center justify-between group
        ${isDroppedMeasure ? 'border-amber-300 hover:border-amber-500' : 'border-gray-200 hover:border-blue-400 cursor-grab active:cursor-grabbing'}`}
    >
      <div className="text-sm font-medium text-gray-700 flex items-center">
        <span className="text-gray-400 mr-2 cursor-grab">⣿</span>
        {item.label}
      </div>

      {isDroppedMeasure && onSettingsClick && (
        <button
          onClick={() => onSettingsClick(item.id)}
          className="p-1 text-gray-400 hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors focus:outline-none"
          title="Measure Settings"
        >
          ⚙️
        </button>
      )}
    </div>
  );
};
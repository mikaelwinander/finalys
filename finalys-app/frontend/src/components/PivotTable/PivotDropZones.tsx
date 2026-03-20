// /frontend/src/components/PivotTable/PivotDropZones.tsx
import React from 'react';
import { DraggableCard } from './DraggableCard';
import { VALUES_VIRTUAL_DIM } from '../../hooks/usePivotDragDrop';
import { Icon } from '../common/Icon';

interface PivotDropZonesProps {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
  handleDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetZone: string, targetIndex?: number) => void;
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string }; 
  onDimClick: (id: string) => void; 
}

export const PivotDropZones: React.FC<PivotDropZonesProps> = ({
  rowDims, colDims, filterDims, measures, 
  handleDragStart, handleDragEnd, handleDragOver, handleDrop,
  resolveDim, resolveMeasure, onDimClick 
}) => {

  const emptyZoneText = "Drag fields here";

  const renderCard = (id: string, index: number, zone: string) => {
    if (id === VALUES_VIRTUAL_DIM) {
      return (
        <DraggableCard 
          key={`${zone}-${id}`}
          item={{ id: VALUES_VIRTUAL_DIM, label: '∑ Datasets & Metrics' }} 
          zone={zone}
          index={index}
          onDragStart={(e) => handleDragStart(e, id, zone, index)} 
          onDragEnd={handleDragEnd}
          onDropTarget={(e, dropZone, targetIndex) => handleDrop(e, dropZone, targetIndex)} 
          onClick={() => onDimClick(id)} // <-- NO extra wrappers!
        />
      );
    }

    return (
      <DraggableCard 
        key={`${zone}-${id}`}
        item={resolveDim(id)} 
        zone={zone} 
        index={index}
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        onDropTarget={(e, dropZone, targetIndex) => handleDrop(e, dropZone, targetIndex)} 
        onClick={() => onDimClick(id)} // <-- NO extra wrappers!
      />
    );
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[400px]">
      
      {/* TOP AREA: Filters */}
      <div 
        className="w-full min-h-[80px] bg-surface border-2 border-dashed border-border rounded-lg p-4 flex flex-col transition-colors hover:border-interactive hover:bg-interactive-muted/30"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'filter')}
      >
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Icon name="filter" size={14} /> Filters
        </h4>
        <div className="flex flex-wrap gap-2 flex-1 items-start">
          {filterDims.length === 0 && <span className="text-sm text-muted-foreground italic mt-1">{emptyZoneText}</span>}
          {filterDims.map((id, index) => renderCard(id, index, 'filter'))}
        </div>
      </div>

      {/* BOTTOM AREA: The Matrix Grid */}
      <div className="flex gap-4 flex-1">
        
        {/* LEFT COLUMN: Rows */}
        <div 
          className="w-1/3 min-h-[250px] bg-surface border-2 border-dashed border-border rounded-lg p-4 flex flex-col transition-colors hover:border-interactive hover:bg-interactive-muted/30"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'row')}
        >
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Icon name="moreHoriz" size={14} className="rotate-90" /> Rows
          </h4>
          <div className="flex flex-col gap-2 flex-1">
            {rowDims.length === 0 && <span className="text-sm text-muted-foreground italic">{emptyZoneText}</span>}
            {rowDims.map((id, index) => renderCard(id, index, 'row'))}
          </div>
        </div>

        {/* RIGHT COLUMN: Columns & Measures */}
        <div className="w-2/3 flex flex-col gap-4">
          
          {/* TOP RIGHT: Columns */}
          <div 
            className="flex-1 min-h-[120px] bg-surface border-2 border-dashed border-border rounded-lg p-4 flex flex-col transition-colors hover:border-interactive hover:bg-interactive-muted/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'col')}
          >
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icon name="moreHoriz" size={14} /> Columns
            </h4>
            <div className="flex flex-wrap gap-2 flex-1 items-start">
              {colDims.length === 0 && <span className="text-sm text-muted-foreground italic mt-1">{emptyZoneText}</span>}
              {colDims.map((id, index) => renderCard(id, index, 'col'))}
            </div>
          </div>

          {/* BOTTOM RIGHT: Preset Measures (Values) - NOT a drop zone! */}
          <div className="flex-1 min-h-[120px] bg-emerald-50/50 border-2 border-dashed border-emerald-300 rounded-lg p-4 flex flex-col">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Icon name="calculator" size={14} /> Metric Presets (Static)
            </h4>
            <p className="text-xs text-emerald-700/70 mb-3 -mt-1">
              Controls the math operation. Drag the "Datasets & Metrics" pill above to position these values in the matrix.
            </p>
            <div className="flex flex-wrap gap-2 flex-1 items-start">
              {measures.map((id) => (
                <div 
                  key={`measure-${id}`} 
                  onClick={() => onDimClick(id)} 
                  className="cursor-pointer px-3 py-1.5 bg-surface border border-emerald-200 rounded-md shadow-sm text-sm font-medium text-emerald-800 hover:bg-emerald-50 hover:border-emerald-400 transition-colors flex items-center gap-2"
                >
                  <Icon name="calculator" size={14} className="text-emerald-500" />
                  {resolveMeasure(id).label}
                  <Icon name="settings" size={12} className="text-emerald-500/50 ml-1" />
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
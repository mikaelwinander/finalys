import React from 'react';
import { DraggableCard } from './DraggableCard';

interface PivotDropZonesProps {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
  handleDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetZone: string) => void;
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
  onMeasureSettingsClick: (id: string) => void;
}

export const PivotDropZones: React.FC<PivotDropZonesProps> = ({
  rowDims, colDims, filterDims, measures,
  handleDragStart, handleDragEnd, handleDragOver, handleDrop,
  resolveDim, resolveMeasure, onMeasureSettingsClick
}) => {

  const emptyZoneText = "Drag fields here";

  return (
    <div className="flex flex-col gap-4 w-full h-full min-h-[400px]">
      
      {/* TOP AREA: Filters */}
      <div 
        className="w-full min-h-[80px] bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col transition-colors hover:border-blue-400 hover:bg-blue-50/30"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, 'filter')}
      >
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>🔍</span> Filters
        </h4>
        <div className="flex flex-wrap gap-2 flex-1 items-start">
          {filterDims.length === 0 && <span className="text-sm text-gray-400 italic mt-1">{emptyZoneText}</span>}
          {filterDims.map((id, index) => (
            <DraggableCard 
              key={`filter-${id}`} item={resolveDim(id)} zone="filter" index={index}
              onDragStart={handleDragStart} onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM AREA: The Matrix Grid */}
      <div className="flex gap-4 flex-1">
        
        {/* LEFT COLUMN: Rows */}
        <div 
          className="w-1/3 min-h-[250px] bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col transition-colors hover:border-blue-400 hover:bg-blue-50/30"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'row')}
        >
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>⏸️</span> Rows
          </h4>
          <div className="flex flex-col gap-2 flex-1">
            {rowDims.length === 0 && <span className="text-sm text-gray-400 italic">{emptyZoneText}</span>}
            {rowDims.map((id, index) => (
              <DraggableCard 
                key={`row-${id}`} item={resolveDim(id)} zone="row" index={index}
                onDragStart={handleDragStart} onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Columns & Measures */}
        <div className="w-2/3 flex flex-col gap-4">
          
          {/* TOP RIGHT: Columns */}
          <div 
            className="flex-1 min-h-[120px] bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col transition-colors hover:border-blue-400 hover:bg-blue-50/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'col')}
          >
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>🔀</span> Columns
            </h4>
            <div className="flex flex-wrap gap-2 flex-1 items-start">
              {colDims.length === 0 && <span className="text-sm text-gray-400 italic mt-1">{emptyZoneText}</span>}
              {colDims.map((id, index) => (
                <DraggableCard 
                  key={`col-${id}`} item={resolveDim(id)} zone="col" index={index}
                  onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                />
              ))}
            </div>
          </div>

          {/* BOTTOM RIGHT: Measures (Values) */}
          <div 
            className="flex-1 min-h-[120px] bg-emerald-50/30 border-2 border-dashed border-emerald-300 rounded-lg p-4 flex flex-col transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'measure')}
          >
            <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-2">
              <span>∑</span> Values
            </h4>
            <div className="flex flex-wrap gap-2 flex-1 items-start">
              {measures.length === 0 && <span className="text-sm text-emerald-600/60 italic mt-1">{emptyZoneText}</span>}
              {measures.map((id, index) => (
                <div key={`measure-${id}`} onClick={() => onMeasureSettingsClick(id)} className="cursor-pointer">
                  <DraggableCard 
                    item={resolveMeasure(id)} zone="measure" index={index}
                    onDragStart={handleDragStart} onDragEnd={handleDragEnd}
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
};
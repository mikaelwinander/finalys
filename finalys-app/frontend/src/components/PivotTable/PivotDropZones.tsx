import React from 'react';
import { DraggableCard } from './DraggableCard';

export interface PivotDropZonesProps {
  rowDims: string[];
  colDims: string[];
  filterDims: string[];
  measures: string[];
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, zone: string) => void;
  handleDragStart: (e: React.DragEvent, id: string, zone: string, index: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  resolveDim: (id: string) => { id: string; label: string };
  resolveMeasure: (id: string) => { id: string; label: string };
  onMeasureSettingsClick: (id: string) => void;
}

export const PivotDropZones: React.FC<PivotDropZonesProps> = ({
  rowDims,
  colDims,
  filterDims,
  measures,
  handleDragOver,
  handleDrop,
  handleDragStart,
  handleDragEnd,
  resolveDim,
  resolveMeasure,
  onMeasureSettingsClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Filters Zone */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'filter')}>
        <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">Filters</h3>
        {filterDims.map((id, index) => (
          <DraggableCard key={`filter-${id}-${index}`} item={resolveDim(id)} zone="filter" index={index} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        ))}
        {filterDims.length === 0 && <p className="text-xs text-emerald-500 italic text-center py-2">Drop to filter</p>}
      </div>

      {/* Columns Zone */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'col')}>
        <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Columns</h3>
        {colDims.map((id, index) => (
          <DraggableCard key={`col-${id}-${index}`} item={resolveDim(id)} zone="col" index={index} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        ))}
        {colDims.length === 0 && <p className="text-xs text-indigo-400 italic text-center py-2">Drop columns</p>}
      </div>

      {/* Rows Zone */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'row')}>
        <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">Rows</h3>
        {rowDims.map((id, index) => (
          <DraggableCard key={`row-${id}-${index}`} item={resolveDim(id)} zone="row" index={index} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
        ))}
        {rowDims.length === 0 && <p className="text-xs text-blue-400 italic text-center py-2">Drop rows</p>}
      </div>

      {/* Measures Zone */}
      <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 shadow-sm min-h-[120px]" onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'measure')}>
        <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-3 flex justify-between items-center">
          <span>Values</span>
          {measures.length > 0 && <span className="text-[10px] font-normal italic opacity-70">Click ⚙️ for settings</span>}
        </h3>
        {measures.map((id, index) => (
          <DraggableCard key={`measure-${id}-${index}`} item={resolveMeasure(id)} zone="measure" index={index} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onSettingsClick={onMeasureSettingsClick} />
        ))}
        {measures.length === 0 && <p className="text-xs text-amber-600 italic text-center py-2">Drop values</p>}
      </div>
    </div>
  );
};
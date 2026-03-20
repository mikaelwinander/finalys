import React from 'react';

export interface PivotSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  measureLabel: string;
  availableDatasets: string[];
  datasetIds: string[];
  toggleDataset: (ds: string) => void;
  datasetLayout: 'col' | 'row';
  setDatasetLayout: (layout: 'col' | 'row') => void;
  includeAdjustments: boolean;
  setIncludeAdjustments: (val: boolean) => void;
  showVariance: boolean;
  setShowVariance: (val: boolean) => void;
}

export const PivotSettingsModal: React.FC<PivotSettingsModalProps> = ({
  isOpen,
  onClose,
  measureLabel,
  availableDatasets,
  datasetIds,
  toggleDataset,
  datasetLayout,
  setDatasetLayout,
  includeAdjustments,
  setIncludeAdjustments,
  showVariance,
  setShowVariance
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">{measureLabel} Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 focus:outline-none">✕</button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Datasets Configuration */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Compare Datasets</label>
            <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              {availableDatasets.map((ds) => (
                <label key={ds} className="flex items-center gap-3 cursor-pointer p-1 hover:bg-white rounded transition-colors">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={datasetIds.includes(ds)}
                    onChange={() => toggleDataset(ds)}
                  />
                  <span className="text-sm text-gray-800">{ds}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Layout Direction */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dataset Layout</label>
            <div className="flex p-1 bg-gray-100 rounded-lg">
              <button 
                onClick={() => setDatasetLayout('col')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${datasetLayout === 'col' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Columns
              </button>
              <button 
                onClick={() => setDatasetLayout('row')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${datasetLayout === 'row' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Rows
              </button>
            </div>
          </div>

          {/* Adjustments & Variance Toggles */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Calculations</label>
            
            <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-sm font-medium text-gray-700">Include Adjustments/Simulations</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={includeAdjustments} onChange={(e) => setIncludeAdjustments(e.target.checked)} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
              </label>
            </div>

            {datasetIds.length === 2 && (
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">Calculate Variance</span>
                  <span className="text-xs text-gray-400">Shows difference between the 2 datasets</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showVariance} onChange={(e) => setShowVariance(e.target.checked)} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none shadow-sm"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
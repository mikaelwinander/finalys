import React from 'react';

// This is the shape of the data we will eventually get from BigQuery
export interface AdjustmentRecord {
  id: string; // We'll use a hash or timestamp as a unique ID
  createdAt: string;
  comment: string;
  coordinates: string; // e.g., "Verksamhet 10, Konto 3000"
  totalAmount: number;
}

interface SimulationHistoryPanelProps {
  history: AdjustmentRecord[];
  onUndo: (id: string) => void;
  isLoading: boolean;
}

export const SimulationHistoryPanel: React.FC<SimulationHistoryPanelProps> = ({ 
  history, 
  onUndo, 
  isLoading 
}) => {
  if (isLoading) {
    return <div className="p-4 text-sm text-gray-500 animate-pulse">Loading simulation history...</div>;
  }

  if (history.length === 0) {
    return null; // Don't show the panel if there are no simulations
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-6 overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
          Simulation Audit Trail
        </h3>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {history.length} recent changes
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-2 font-medium">Time</th>
              <th className="px-4 py-2 font-medium">Scope (Coordinates)</th>
              <th className="px-4 py-2 font-medium">Instruction / Comment</th>
              <th className="px-4 py-2 font-medium text-right">Net Change (Δ)</th>
              <th className="px-4 py-2 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {history.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {new Date(record.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                  {record.coordinates}
                </td>
                <td className="px-4 py-3 text-gray-600 italic">
                  "{record.comment}"
                </td>
                <td className={`px-4 py-3 text-right font-mono font-medium ${record.totalAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {record.totalAmount > 0 ? '+' : ''}
                  {new Intl.NumberFormat('en-US').format(record.totalAmount)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button 
                    onClick={() => onUndo(record.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors"
                    title="Undo this simulation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
// /frontend/src/pages/DashboardPage.tsx
import { type FC, useState, useEffect } from 'react';
import { usePivotData } from '../hooks/usePivotData';
import { PivotTable } from '../components/PivotTable/PivotTable';

// Define all possible dimensions
const AVAILABLE_DIMENSIONS = [
  { id: 'period_id', label: 'Period' },
  { id: 'amount_type_id', label: 'Amount Type' },
  { id: 'dim01', label: 'Dim 01 (Account)' },
  { id: 'dim02', label: 'Dim 02 (Region)' },
  { id: 'dim03', label: 'Dim 03' },
  { id: 'dim04', label: 'Dim 04' },
  { id: 'dim05', label: 'Dim 05' },
  { id: 'dim06', label: 'Dim 06' },
  { id: 'dim07', label: 'Dim 07' },
  { id: 'dim08', label: 'Dim 08' },
  { id: 'dim09', label: 'Dim 09' },
  { id: 'dim10', label: 'Dim 10' },
  { id: 'dim11', label: 'Dim 11' },
  { id: 'dim12', label: 'Dim 12' },
];

const DashboardPage: FC = () => {
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [datasetId, setDatasetId] = useState<string>('');
  
  const [dimensions, setDimensions] = useState(['period_id', 'amount_type_id', 'dim01', 'dim02']);
  const [measures] = useState(['amount']);

  // 1. Fetch available datasets when the component mounts
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const response = await fetch('/api/datasets');
        const json = await response.json();
        
        // --- THE FIX ---
        // Safely extract the array, handling cases where Redis returns a stringified JSON
        let safeArray: string[] = [];
        if (typeof json.data === 'string') {
          safeArray = JSON.parse(json.data); // Convert string back to an array
        } else if (Array.isArray(json.data)) {
          safeArray = json.data; // It's already a safe array
        }

        if (safeArray.length > 0) {
          setAvailableDatasets(safeArray);
          setDatasetId(safeArray[0]); // Auto-select the first available version
        }
      } catch (error) {
        console.error('Failed to fetch datasets:', error);
      }
    };
    fetchDatasets();
  }, []);

  // 2. Fetch pivot data (only runs if datasetId is not empty)
  const { data, isLoading, error, refetch } = usePivotData({
    datasetId,
    dimensions,
    measures,
  });

  // Toggle handler for the sidebar checkboxes
  const handleDimensionToggle = (dimensionId: string) => {
    setDimensions((prev) => {
      if (prev.includes(dimensionId)) {
        if (prev.length === 1) return prev; // Prevent unchecking the last dimension
        return prev.filter(d => d !== dimensionId);
      }
      return [...prev, dimensionId];
    });
  };

  // Prevent rendering the table if we are still fetching the available datasets
  if (!datasetId) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
        Discovering available datasets...
      </div>
    );
  }

  return (
    <div className="max-w-screen-2xl mx-auto space-y-6 p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Financial Overview</h1>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-sm font-medium text-gray-500">Active Version:</span>
            <select 
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 pl-2 pr-8 bg-white cursor-pointer"
            >
              {availableDatasets.map((ds) => (
                <option key={ds} value={ds}>
                  {ds}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Configuration Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm h-fit">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
            Configure View
          </h2>
          
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Rows & Columns</h3>
            {AVAILABLE_DIMENSIONS.map((dim) => (
              <label key={dim.id} className="flex items-center space-x-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={dimensions.includes(dim.id)}
                  onChange={() => handleDimensionToggle(dim.id)}
                  disabled={dimensions.length === 1 && dimensions.includes(dim.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  {dim.label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-8 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase">Measures</h3>
            <label className="flex items-center space-x-3 cursor-not-allowed">
              <input 
                type="checkbox"
                checked={true}
                readOnly
                className="h-4 w-4 text-blue-600 border-gray-300 rounded opacity-50"
              />
              <span className="text-sm text-gray-700">Amount (Sum)</span>
            </label>
          </div>
        </div>

        {/* Pivot Table Area */}
        <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              Aggregating Data...
            </div>
          ) : (
            <PivotTable 
              data={data}
              dimensions={dimensions}
              measures={measures}
              isLoading={isLoading} // <--- Add this line right here!
              error={error}
            />
          )}
        </div>
        
      </div>
    </div>
  );
};

export default DashboardPage;
// /frontend/src/hooks/usePivotData.ts
import { useState, useEffect } from 'react';
import { pivotService } from '../services/pivotService';
import { PivotRequestParams, PivotRow } from '../types/pivot.types';
// import { useAuth } from './useAuth'; // You will build this next to get the token

interface UsePivotDataResult {
  data: PivotRow[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const usePivotData = (params: PivotRequestParams): UsePivotDataResult => {
  const [data, setData] = useState<PivotRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Placeholder for your actual auth hook
  // const { token } = useAuth(); 
  const token = 'placeholder_token'; 

  const fetchData = async () => {
    // Prevent fetching if core parameters or token are missing
    if (!params.datasetId || !params.dimensions.length || !params.measures.length || !token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await pivotService.getPivotData(params, token);
      setData(result.rows); // The API sends a summarized response back to the frontend
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pivot data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    params.datasetId,
    // Stringify arrays/objects for deep comparison in the dependency array
    JSON.stringify(params.dimensions),
    JSON.stringify(params.measures),
    JSON.stringify(params.filters),
    token
  ]);

  return { data, isLoading, error, refetch: fetchData };
};
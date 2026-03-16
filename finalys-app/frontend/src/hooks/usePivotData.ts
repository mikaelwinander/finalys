// /frontend/src/hooks/usePivotData.ts
import { useState, useEffect } from 'react';
import { pivotService } from '../services/pivotService';
import { useAuth } from './useAuth';
import type { PivotRequestParams, PivotRow } from '../types/pivot.types';

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
  
  // Extract token from your React Context
  const { token, isLoading: isAuthLoading } = useAuth(); 
  
  const fetchData = async () => {
    // Prevent fetching if core parameters or token are missing
    // CHANGED: Checking params.datasetIds array instead of string
    if (!params.datasetIds || !params.datasetIds.length || !params.dimensions.length || !params.measures.length || !token) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await pivotService.getPivotData(params, token);
      setData(result.rows); 
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pivot data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthLoading) return; // Wait for Identity Platform to initialize
    fetchData();
  }, [
    JSON.stringify(params.datasetIds), // <--- CHANGED: Stringify the array to prevent infinite loops
    JSON.stringify(params.dimensions),
    JSON.stringify(params.measures),
    JSON.stringify(params.filters),
    params.includeAdjustments, 
    token,
    isAuthLoading
  ]);

  return { data, isLoading, error, refetch: fetchData };
};
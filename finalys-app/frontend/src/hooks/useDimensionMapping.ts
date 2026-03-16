// /frontend/src/hooks/useDimensionMapping.ts
import { useState, useEffect } from 'react';
import { pivotService } from '../services/pivotService';
import { useAuth } from './useAuth';

export const useDimensionMapping = () => {
  const [dimensionMap, setDimensionMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchMapping = async () => {
      if (!token) return;
      
      try {
        const mapping = await pivotService.getDimensionMapping(token);
        setDimensionMap(mapping);
      } catch (error) {
        console.error('Failed to load dimension mapping', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMapping();
  }, [token]);

  return { dimensionMap, isLoading };
};
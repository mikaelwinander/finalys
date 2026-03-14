
import { useState, useEffect } from 'react';

export const useApi = <T,>(apiCall: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const callApi = async () => {
      try {
        const result = await apiCall();
        setData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    callApi();
  }, [apiCall]);

  return { data, error, isLoading };
};

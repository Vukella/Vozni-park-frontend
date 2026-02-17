import { useState, useEffect, useCallback } from 'react';

interface UseApiDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string;
  refresh: () => void;
}

export function useApiData<T>(
  fetchFn: () => Promise<{ data: T[] }>,
  deps: unknown[] = []
): UseApiDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchFn();
      setData(response.data);
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response: { data?: { message?: string }; status: number } }).response;
        setError(response.data?.message || `Request failed (${response.status})`);
      } else {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

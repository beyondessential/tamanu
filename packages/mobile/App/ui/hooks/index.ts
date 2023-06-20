import { useContext, useEffect, useState } from 'react';
import { BackendManager } from '~/services/BackendManager';
import { BackendContext } from '~/ui/contexts/BackendContext';

export type ResultArray<T> = [T | null, Error | null];

export const useCancelableEffect = <T>(
  fetcher: () => Promise<T> | T,
  dependencies = [],
): ResultArray<T> => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let canceled = false;
    (async (): Promise<void> => {
      try {
        const result = await fetcher();
        if (!canceled) {
          setData(result);
        }
      } catch (e) {
        setError(e);
      } finally {
        setIsLoading(false);
      }
    })();
    return (): void => {
      canceled = true;
    };
  }, dependencies);

  return [data, error, isLoading];
};

export const useBackendEffect = <T>(
  call: (backendManager: BackendManager) => Promise<T> | T,
  dependencies = [],
): ResultArray<T> => {
  const backend = useContext(BackendContext);

  return useCancelableEffect(() => call(backend), dependencies);
};

export const useBackend = () => useContext(BackendContext);

import { useContext, useEffect, useState } from 'react';
import { BackendManager } from '~/services/BackendManager';
import { BackendContext } from '~/ui/contexts/BackendContext';

export type ResultArray<T> = [T | null, Error | null, boolean, () => void];

export const useCancelableEffect = <T>(
  fetcher: () => Promise<T> | T,
  dependencies = [],
): ResultArray<T> => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const onFetch = async (isCancel?: () => boolean) => {
    setIsLoading(true);
    try {
      const result = await fetcher();
      if (!isCancel || !isCancel()) {
        setData(result);
      }
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let canceled = false;
    onFetch(() => canceled);
    return (): void => {
      canceled = true;
    };
  }, [...dependencies, onFetch]);

  return [data, error, isLoading, onFetch];
};

export const useBackendEffect = <T>(
  call: (backendManager: BackendManager) => Promise<T> | T,
  dependencies = [],
): ResultArray<T> => {
  const backend = useContext(BackendContext);

  return useCancelableEffect(() => call(backend), dependencies);
};

export const useBackend = () => useContext(BackendContext);

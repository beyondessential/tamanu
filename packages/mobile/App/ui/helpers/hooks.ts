import { useState, useEffect, useContext } from 'react';
import { BackendContext } from '~/services/backendProvider';

export const useCancelableEffect = (fetcher, dependencies = []): any[] => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

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
      }
    })();
    return (): void => {
      canceled = true;
    };
  }, dependencies);

  return [data, error];
};

export const useBackendEffect = (call, dependencies = []): any[] => {
  const backend = useContext(BackendContext);

  return useCancelableEffect(() => call(backend), dependencies);
};

export const useBackend = (): any => useContext(BackendContext);

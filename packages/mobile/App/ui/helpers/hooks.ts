import { useState, useEffect, useContext } from 'react';
import { BackendContext } from '../../services/backendContext';

export const useCancelableEffect = (fetcher, dependencies=[]) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const result = await fetcher();
        if(!canceled) {
          setData(result);
        }
      } catch(e) {
        setError(e);
      }
    })();
    return () => { canceled = true };
  }, dependencies);

  return [data, error];
};

export const useBackendEffect = (call, dependencies = []) => {
  const backend = useContext(BackendContext);

  return useCancelableEffect(() => call(backend), dependencies);
};

export const useBackend = () => useContext(BackendContext);

import { useState, useEffect, useContext } from 'react';
import { APIContext } from '../../services/apiContext';

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

export const useAPIEffect = (call, dependencies = []) => {
  const context = useContext(APIContext);

  return useCancelableEffect(() => call(context), dependencies);
};

export const useAPI = () => useContext(APIContext);

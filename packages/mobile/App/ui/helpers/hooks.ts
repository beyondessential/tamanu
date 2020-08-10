import { useState, useEffect, useContext } from 'react';
import { APIContext } from '../../services/apiContext';

export const useCancelableEffect = (fetcher, dependencies=[]) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const result = await fetcher();
      if(!canceled) {
        setData(result);
      }
    })();
    return () => { canceled = true };
  }, dependencies);

  return data;
};

export const useAPIEffect = (call, dependencies = []) => {
  const context = useContext(APIContext);

  return useCancelableEffect(() => call(context), dependencies);
};

export const useAPI = () => useContext(APIContext);

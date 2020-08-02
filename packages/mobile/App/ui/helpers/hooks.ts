import { useState, useEffect } from 'react';

export const useCancelableEffect = (initialState, fetcher) => {
  const [data, setData] = useState(initialState);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const result = await fetcher();
      if(!canceled) {
        setData(result);
      }
    })();
    return () => { canceled = true };
  }, []);

  return [data];
};

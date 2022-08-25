import { useState, useEffect } from 'react';
import { useApi } from '../index';

export const useReferenceData = referenceDataId => {
  const [data, setData] = useState({});
  const api = useApi();

  useEffect(() => {
    (async () => {
      if (referenceDataId) {
        const res = await api.get(`referenceData/${encodeURIComponent(referenceDataId)}`);
        setData(res);
      }
    })();
  }, [api, referenceDataId]);

  return data;
};

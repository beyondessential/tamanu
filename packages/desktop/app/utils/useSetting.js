import { useEffect, useState } from 'react';
import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';

export const useSetting = key => {
  const api = useApi();
  const { facility } = useAuth();

  const [setting, setSetting] = useState('');

  useEffect(() => {
    api.get(`setting/${key}?facilityId=${facility.id}`).then(response => {
      setSetting(response.data);
    });
  }, [api, key, facility.id]);

  return setting;
};

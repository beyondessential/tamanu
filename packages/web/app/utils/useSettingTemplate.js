import { useQuery } from '@tanstack/react-query';

import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';

export const useSettingTemplate = key => {
  const api = useApi();
  const { facility } = useAuth();

  return useQuery(['setting-template', key, facility.id], () =>
    api.get(`setting-template/${key}`, { facilityId: facility.id }),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useVaccinationSettings = key => {
  const api = useApi();
  return useQuery(['vaccinationSettings', key], () =>
    api.get(`vaccinationSettings/${encodeURIComponent(key)}`),
  );
};

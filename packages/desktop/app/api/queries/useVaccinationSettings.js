import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useVaccinationSettings = key => {
  const api = useApi();
  const { facility } = useAuth();

  return useQuery(['vaccinationSettings', key], () =>
    api.get(`vaccinationSettings/${encodeURIComponent(key)}`, {
      facilityId: facility.id,
    }),
  );
};

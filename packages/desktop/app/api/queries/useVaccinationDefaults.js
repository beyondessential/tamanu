import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useVaccinationDefaults = patientId => {
  const api = useApi();
  const { facility } = useAuth();

  return useQuery(['vaccinationDefaults', patientId], () =>
    api.get(`vaccinationDefaults/${encodeURIComponent('vaccinations.defaults')}`, {
      facilityId: facility.id,
    }),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { useAuth } from '../../contexts/Auth';

export const useDispensableMedicationsQuery = (patientId, options = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(
    ['dispensableMedications', patientId, facilityId],
    () =>
      api.get('medication/dispensable-medications', {
        patientId,
        facilityId,
      }),
    {
      enabled: Boolean(patientId) && Boolean(facilityId) && (options.enabled ?? true),
      ...options,
    },
  );
};


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
      ...options,
      // Spread first: a caller-supplied `enabled` narrows the query further, it never lifts the
      // requirement for a patient and a facility to fetch for.
      enabled: Boolean(patientId) && Boolean(facilityId) && (options.enabled ?? true),
    },
  );
};


import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const usePatientCurrentEncounterQuery = (patientId, options = {}) => {
  const { facilityId } = useAuth();
  const api = useApi();
  return useQuery(
    ['patientCurrentEncounter', patientId],
    () => api.get(route('patient/:patientId/currentEncounter', { patientId }), { facilityId }),
    options,
  );
};

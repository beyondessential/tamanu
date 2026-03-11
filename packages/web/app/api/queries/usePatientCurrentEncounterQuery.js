import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const usePatientCurrentEncounterQuery = (patientId, options = {}) => {
  const { facilityId } = useAuth();
  const api = useApi();
  return useQuery(
    ['patientCurrentEncounter', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/currentEncounter`, { facilityId }),
    options,
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientCurrentEncounterQuery = patientId => {
  const api = useApi();
  return useQuery(['patientCurrentEncounter', patientId], () =>
    api.get(`patient/${encodeURIComponent(patientId)}/currentEncounter`),
  );
};

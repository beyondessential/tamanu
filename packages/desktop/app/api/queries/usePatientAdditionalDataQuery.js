import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientAdditionalDataQuery = patientId => {
  const api = useApi();

  return useQuery(['additionalData', patientId], () =>
    api.get(`patient/${encodeURIComponent(patientId)}/additionalData`),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientAdditionalData = patientId => {
  const api = useApi();

  return useQuery(['additionalData', patientId], () =>
    api.get(`patient/${patientId}/additionalData`),
  );
};

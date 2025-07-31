import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useRegisterPatientPortal = useMutationOptions => {
  const api = useApi();
  return useMutation(
    ({ patientId }) => api.post(`patient/${patientId}/portal/register`),
    useMutationOptions,
  );
};

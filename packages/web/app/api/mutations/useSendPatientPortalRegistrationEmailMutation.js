import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useSendPatientPortalRegistrationEmail = useMutationOptions => {
  const api = useApi();
  return useMutation(({ patientId, email }) => {
    return api.post(`patient/${patientId}/portal/send-registration-email`, { email });
  }, useMutationOptions);
};

import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useSendPatientPortalRegistrationEmail = useMutationOptions => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useMutation(({ patientId, email }) => {
    return api.post(`patient/${patientId}/portal/send-registration-email`, { email, facilityId });
  }, useMutationOptions);
};

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';

export const useRegisterPatientPortal = options => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useMutation(
    ({ patientId, email }) =>
      api.post(`patient/${patientId}/portal/register`, { email, facilityId }),
    options,
  );
};

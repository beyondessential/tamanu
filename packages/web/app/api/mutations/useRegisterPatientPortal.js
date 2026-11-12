import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useRegisterPatientPortal = options => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useMutation(
    ({ patientId, email }) =>
      api.post(route('patient/:patientId/portal/register', { patientId }), { email, facilityId }),
    options,
  );
};

import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useSendPatientPortalForm = useMutationOptions => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useMutation(
    ({ patientId, formId, assignedAt, email }) =>
      api.post(`patient/${patientId}/portal/forms`, { formId, assignedAt, email, facilityId }),
    useMutationOptions,
  );
};

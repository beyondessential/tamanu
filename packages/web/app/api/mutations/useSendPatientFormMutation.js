import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useSendPatientPortalForm = useMutationOptions => {
  const api = useApi();
  return useMutation(
    ({ patientId, formId, assignedAt, email }) =>
      api.post(`patient/${patientId}/portal/forms`, { formId, assignedAt, email }),
    useMutationOptions,
  );
};

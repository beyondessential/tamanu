import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryClinicalStatus = (patientId, programRegistryId, fetchOptions) => {
  const api = useApi();

  return useQuery(['clinicalStatuses', programRegistryId], () =>
    api.get(
      `patient/${encodeURIComponent(patientId)}/programRegistration/${encodeURIComponent(
        programRegistryId,
      )}/clinicalStatuses`,
      fetchOptions,
    ),
  );
};

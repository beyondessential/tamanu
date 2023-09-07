import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryClinicalStatus = (programRegistryId, fetchOptions) => {
  const api = useApi();

  return useQuery(['clinicalStatuses', programRegistryId], () =>
    api.get(
      `programRegistration/${encodeURIComponent(programRegistryId)}/clinicalStatuses`,
      fetchOptions,
    ),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryConditions = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['PatientProgramRegistryConditions', programRegistryId], () =>
    api.get(`programRegistry/${encodeURIComponent(programRegistryId)}/conditions`, fetchOptions),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistry = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['ProgramRegistry', programRegistryId], () =>
    api.get(`programRegistry/${encodeURIComponent(programRegistryId)}`, fetchOptions),
  );
};

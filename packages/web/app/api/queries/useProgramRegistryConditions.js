import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryConditions = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(['ProgramRegistryConditions', programRegistryId], () =>
    api.get(`programRegistry/${encodeURIComponent(programRegistryId)}/conditions`, {
      orderBy: 'name',
      order: 'ASC',
      ...fetchOptions,
    }),
  );
};

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useProgramRegistryQuery = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(
    ['ProgramRegistry', programRegistryId],
    () => api.get(`programRegistry/${encodeURIComponent(programRegistryId)}`, fetchOptions),
    {
      enabled: !!programRegistryId,
    },
  );
};

export const useListOfProgramRegistryQuery = () => {
  const api = useApi();
  return useQuery(['ProgramRegistries'], () =>
    api.get('programRegistry', { orderBy: 'name', order: 'ASC' }),
  );
};

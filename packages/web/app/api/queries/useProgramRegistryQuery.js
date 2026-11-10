import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useProgramRegistryQuery = (programRegistryId, fetchOptions) => {
  const api = useApi();
  return useQuery(
    ['programRegistry', programRegistryId, fetchOptions],
    () => api.get(route('programRegistry/:programRegistryId', { programRegistryId }), fetchOptions),
    { enabled: Boolean(programRegistryId) },
  );
};

export const useListOfProgramRegistryQuery = () => {
  const api = useApi();
  return useQuery(['programRegistry'], () =>
    api.get('programRegistry', { orderBy: 'name', order: 'ASC' }),
  );
};

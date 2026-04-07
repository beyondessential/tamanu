import { useQuery } from '@tanstack/react-query';
import { useApi } from '../../../../api/useApi';

export function useProgramRegistriesQuery(options = {}) {
  const api = useApi();

  const getProgramRegistries = async () => {
    const response = await api.get('admin/programRegistries', { orderBy: 'name', order: 'ASC' });
    return response.data;
  };

  return useQuery({
    queryKey: ['programRegistries'],
    queryFn: getProgramRegistries,
    ...options,
  });
}

export function useProgramRegistryQuery(programRegistryId) {
  const api = useApi();

  const getProgramRegistry = async () =>
    await api.get(`admin/programRegistry/${encodeURIComponent(programRegistryId)}`);

  return useQuery({
    queryKey: ['adminProgramRegistry', programRegistryId],
    queryFn: getProgramRegistry,
    enabled: Boolean(programRegistryId),
  });
}

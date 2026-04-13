import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../../../api/useApi';

async function fetchPrograms(api) {
  const response = await api.get('admin/programs');
  return response.data;
}

export function useProgramsQuery(options = {}) {
  const api = useApi();

  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => await fetchPrograms(api),
    ...options,
  });
}

export function useProgramQuery(programId, options = {}) {
  const api = useApi();

  return useQuery({
    queryKey: ['programs', programId],
    queryFn: async () => await fetchPrograms(api),
    select: data => data?.find(p => p.id === programId) ?? null,
    enabled: Boolean(programId),
    ...options,
  });
}

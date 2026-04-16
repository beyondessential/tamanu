import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../../../api/useApi';

export function useProgramsQuery(options) {
  const api = useApi();

  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await api.get('admin/programs')).data,
    ...options,
  });
}

export function useProgramQuery(programId, options = {}) {
  const { enabled = true } = options;
  const api = useApi();

  return useQuery({
    queryKey: ['programs', programId],
    queryFn: async () => await api.get(`admin/program/${encodeURIComponent(programId)}`),
    ...options,
    enabled: enabled && Boolean(programId),
  });
}

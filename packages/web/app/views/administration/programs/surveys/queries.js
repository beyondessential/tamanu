import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useApi } from '../../../../api/useApi';
import { route } from '@tamanu/api-client';

export function useProgramsQuery(options) {
  const api = useApi();

  return useQuery({
    queryKey: ['programs'],
    queryFn: async () => (await api.get('admin/programs')).data,
    ...options,
  });
}

export function useProgramQuery(programId, useQueryOptions = {}) {
  const { enabled = true, ...rest } = useQueryOptions;
  const api = useApi();

  return useQuery({
    ...rest,
    queryKey: ['programs', programId],
    queryFn: async () => await api.get(route('admin/program/:programId', { programId })),
    enabled: enabled && Boolean(programId),
  });
}

export function useProgramMutation(programId, useMutationOptions = {}) {
  const { onSuccess, ...rest } = useMutationOptions;
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    ...rest,
    mutationKey: ['programs', programId],
    mutationFn: async ({ name }) =>
      await api.patch(route('admin/program/:programId', { programId }), { name }),
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: ['programs'] });
      await onSuccess?.(data, variables, context);
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useProgramRegistryMutation(useMutationOptions = {}) {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['programRegistry', 'updateMetadata'],
    mutationFn: async ({ programRegistryId, name, visibilityStatus, currentlyAtType }) =>
      await api.patch(`admin/programRegistry/${encodeURIComponent(programRegistryId)}`, {
        name,
        visibilityStatus,
        currentlyAtType,
      }),
    onSuccess: async (data, variables, context) => {
      void (await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['adminProgramRegistry', variables.programRegistryId],
        }),
        queryClient.invalidateQueries({ queryKey: ['programRegistries'] }),
      ]));
      await useMutationOptions.onSuccess?.(data, variables, context);
    },
    onError: useMutationOptions.onError,
  });
}

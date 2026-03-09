import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTogglePermissionMutation = (rolesQueryParam, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async toggles => {
      const items = Array.isArray(toggles) ? toggles : [toggles];
      await Promise.all(
        items.map(({ verb, noun, objectId, roleId, hasPermission }) => {
          const params = { verb, noun, roleId, ...(objectId ? { objectId } : {}) };
          return hasPermission
            ? api.delete('admin/permissions', params)
            : api.post('admin/permissions', params);
        }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPermissions', rolesQueryParam]);
    },
    ...options,
  });
};

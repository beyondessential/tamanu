import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTogglePermissionMutation = (rolesQueryParam, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async toggles => {
      const items = Array.isArray(toggles) ? toggles : [toggles];

      // Do not use Promise.all here to avoid partial failures when some permissions fail to delete/create.
      for (const { verb, noun, objectId, roleId, hasPermission } of items) {
        const params = { verb, noun, roleId, ...(objectId ? { objectId } : {}) };
        if (hasPermission) {
          await api.delete('admin/permissions', params);
        } else {
          await api.post('admin/permissions', params);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPermissions', rolesQueryParam]);
    },
    ...options,
  });
};

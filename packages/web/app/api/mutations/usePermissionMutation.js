import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTogglePermissionMutation = (rolesQueryParam, options = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async toggles => {
      const items = Array.isArray(toggles) ? toggles : [toggles];
      const toCreate = [];
      const toDelete = [];
      for (const { verb, noun, objectId, roleId, hasPermission } of items) {
        const params = { verb, noun, roleId, ...(objectId ? { objectId } : {}) };
        if (hasPermission) {
          toDelete.push(params);
        } else {
          toCreate.push(params);
        }
      }
      if (toCreate.length) {
        await api.post('admin/permissions/create-batch', { permissions: toCreate });
      }
      if (toDelete.length) {
        await api.post('admin/permissions/delete-batch', { permissions: toDelete });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPermissions', rolesQueryParam]);
    },
    ...options,
  });
};

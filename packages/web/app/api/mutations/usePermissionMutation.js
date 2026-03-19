import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useTogglePermissionMutation = (rolesQueryParam, useMutationOptions) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async toggles => {
      const items = Array.isArray(toggles) ? toggles : [toggles];
      const toCreate = [];
      const toDelete = [];
      for (const { verb, noun, objectId, roleId, currentlyHasPermission } of items) {
        const params = { verb, noun, roleId, ...(objectId ? { objectId } : {}) };
        if (currentlyHasPermission) {
          toDelete.push(params);
        } else {
          toCreate.push(params);
        }
      }
      const promises = [];
      if (toCreate.length) {
        promises.push(api.post('admin/permissions/create-batch', { permissions: toCreate }));
      }
      if (toDelete.length) {
        promises.push(api.post('admin/permissions/delete-batch', { permissions: toDelete }));
      }
      await Promise.all(promises);
    },
    ...useMutationOptions,
    onSuccess: () => {
      queryClient.invalidateQueries(['adminPermissions', rolesQueryParam]);
      useMutationOptions?.onSuccess?.();
    },
  });
};

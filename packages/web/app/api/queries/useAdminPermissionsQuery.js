import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminPermissionsQuery = (rolesQueryParam, options = {}) => {
  const api = useApi();

  return useQuery(
    ['adminPermissions', rolesQueryParam],
    () => api.get('admin/permissions', { roles: rolesQueryParam }),
    options,
  );
};

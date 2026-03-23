import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdminPermissionRolesQuery = (options = {}) => {
  const api = useApi();

  return useQuery(
    ['adminPermissionRoles'],
    () => api.get('admin/permissions/roles'),
    options,
  );
};

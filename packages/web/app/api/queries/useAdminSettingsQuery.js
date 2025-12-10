import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { SETTINGS_SCOPES } from '@tamanu/constants';

// Fetch admin-scoped settings from central server
// Use `select` in options to transform the returned data if needed
export const useAdminSettingsQuery = (scope, facilityId, options = {}) => {
  const api = useApi();

  return useQuery(
    ['scopedSettings', scope, facilityId],
    () => api.get('admin/settings', { scope, facilityId }),
    {
      enabled: scope !== SETTINGS_SCOPES.FACILITY || !!facilityId,
      ...options,
    },
  );
};



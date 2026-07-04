import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { SETTINGS_SCOPES } from '@tamanu/constants';

// Fetch admin-scoped settings from central server
// Use `select` in options to transform the returned data if needed
export const useAdminSettingsQuery = (scope, facilityId, deviceId, options = {}) => {
  const api = useApi();

  return useQuery(
    ['scopedSettings', scope, facilityId, deviceId],
    () => api.get('admin/settings', { scope, facilityId, deviceId }),
    {
      enabled:
        (scope !== SETTINGS_SCOPES.FACILITY || !!facilityId) &&
        (scope !== SETTINGS_SCOPES.SERVER || !!deviceId),
      ...options,
    },
  );
};

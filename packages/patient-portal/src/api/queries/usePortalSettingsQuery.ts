import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export interface FieldSetting {
  hidden?: boolean;
  required?: boolean;
}

/** The deployment's settings that apply everywhere in the portal, like which fields it uses. */
export const usePortalSettingsQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, { fields?: Record<string, FieldSetting> }>({
    queryKey: ['settings', 'global'],
    queryFn: () => api.get('settings'),
  });
};

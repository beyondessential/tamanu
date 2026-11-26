import { useQuery } from '@tanstack/react-query';
import { getPatientDetailFieldSettings } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export interface FieldSetting {
  hidden?: boolean;
  required?: boolean;
}

interface PortalSettings {
  fields?: Record<string, FieldSetting>;
  features?: { enablePatientInsurer?: boolean };
}

/** The deployment's settings that apply everywhere in the portal, like which fields it uses. */
export const usePortalSettingsQuery = () => {
  const api = useApi();
  return useQuery<PortalSettings, Error, { fields: Record<string, FieldSetting> }>({
    queryKey: ['settings', 'global'],
    queryFn: () => api.get('settings'),
    select: ({ fields = {}, features }) => ({
      fields: getPatientDetailFieldSettings(fields, Boolean(features?.enablePatientInsurer)),
    }),
  });
};

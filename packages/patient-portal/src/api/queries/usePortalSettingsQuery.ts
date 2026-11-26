import { useQuery } from '@tanstack/react-query';
import {
  getPatientDetailFieldSettings,
  type PatientDetailFieldSetting,
} from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export type FieldSetting = PatientDetailFieldSetting;

interface PortalSettings {
  fields?: Record<string, { hidden?: boolean; requiredPatientData?: boolean }>;
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

import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export interface FieldSetting {
  hidden?: boolean;
  required?: boolean;
}

interface PortalSettings {
  fields?: Record<string, FieldSetting>;
  features?: { enablePatientInsurer?: boolean };
}

const INSURANCE_FIELD_NAMES = ['insurerId', 'insurerPolicyNumber'];

/** Insurance details are hidden unless the deployment uses them, as on Patient details in Tamanu. */
const hideUnusedInsuranceFields = ({ fields = {}, features }: PortalSettings) => {
  if (features?.enablePatientInsurer) return fields;
  const hiddenInsuranceFields = Object.fromEntries(
    INSURANCE_FIELD_NAMES.map(name => [name, { ...fields[name], hidden: true }]),
  );
  return { ...fields, ...hiddenInsuranceFields };
};

/** The deployment's settings that apply everywhere in the portal, like which fields it uses. */
export const usePortalSettingsQuery = () => {
  const api = useApi();
  return useQuery<PortalSettings, Error, { fields: Record<string, FieldSetting> }>({
    queryKey: ['settings', 'global'],
    queryFn: () => api.get('settings'),
    select: settings => ({ fields: hideUnusedInsuranceFields(settings) }),
  });
};

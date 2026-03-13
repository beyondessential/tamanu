import { Setting } from './Setting';

export type ExposedFlag = 'exposedToWeb' | 'exposedToPatientPortal';

export interface SettingsSchema {
  name?: string;
  description?: string;
  highRisk?: boolean;
  requiresRestart?: boolean;
  infoBanner?: string;
  properties: Record<string, Setting | SettingsSchema>;
  exposedToWeb?: boolean;
  exposedToPatientPortal?: boolean;
}

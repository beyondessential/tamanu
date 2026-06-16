import { type Setting } from './Setting.ts';

export type ExposedFlag = 'exposedToWeb' | 'exposedToPatientPortal';

export interface SettingsSchema {
  name?: string;
  description?: string;
  highRisk?: boolean;
  properties: Record<string, Setting | SettingsSchema>;
  exposedToWeb?: boolean;
  exposedToPatientPortal?: boolean;
}

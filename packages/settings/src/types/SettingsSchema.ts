import { Setting } from './Setting';

export interface SettingsSchema {
  name?: string;
  description?: string;
  highRisk?: boolean;
  properties: Record<string, Setting | SettingsSchema>;
  exposedToWeb?: boolean;
}

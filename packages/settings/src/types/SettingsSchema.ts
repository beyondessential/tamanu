import { Setting } from './Setting';

export interface SettingsSchema {
  name?: string;
  description?: string;
  properties: Record<string, Setting | SettingsSchema>;
}

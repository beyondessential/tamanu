import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.SchemaOf<T>;
  unit?: string;
  highRisk?: boolean;
  defaultValue: T;
}

export interface SettingsSchema {
  name?: string;
  description?: string;
  highRisk?: boolean;
  properties: Record<string, Setting | SettingsSchema>;
}

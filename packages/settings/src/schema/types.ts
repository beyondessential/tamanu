import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  unit?: string;
  type: yup.SchemaOf<T>;
  unit?: string;
  defaultValue: T;
}

export interface SettingsSchema {
  name?: string;
  description?: string;
  properties: Record<string, Setting | SettingsSchema>;
}

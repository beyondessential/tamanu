import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  unit?: string;
  schema: yup.SchemaOf<T>;
  defaultValue: T;
}

export interface SettingsSchema {
  name?: string;
  description?: string;
  properties: Record<string, Setting | SettingsSchema>;
}

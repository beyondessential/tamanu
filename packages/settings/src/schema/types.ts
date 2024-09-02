import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.SchemaOf<T>;
  unit?: string;
  defaultValue: T;
  deprecated?: boolean;
}

export interface SettingsSchema {
  name?: string;
  description?: string;
  properties: Record<string, Setting | SettingsSchema>;
}

import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  schema: yup.SchemaOf<T>;
  defaultValue: T;
  deprecated?: boolean;
}

export interface SettingsSchema {
  name?: string;
  description?: string;
  values: Record<string, Setting | SettingsSchema>;
}

import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  schema: yup.SchemaOf<T>;
  defaultValue: T;
}

export interface SettingsSchema {
  description?: string;
  [key: string]: Setting | SettingsSchema | string;
}

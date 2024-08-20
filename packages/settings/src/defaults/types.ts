import * as yup from 'yup';

export interface Setting<T = any> {
  name: string;
  description: string;
  schema: yup.SchemaOf<T>;
  default: T;
}

export interface SettingsSchema {
  [key: string]: Setting | SettingsSchema;
}

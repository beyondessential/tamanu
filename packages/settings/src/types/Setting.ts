import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.SchemaOf<T>;
  unit?: string;
  defaultValue: T;
  deprecated?: boolean;
}

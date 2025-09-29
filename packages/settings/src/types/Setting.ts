import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.Schema<T>;
  unit?: string;
  highRisk?: boolean;
  defaultValue: T;
  deprecated?: boolean;
  exposedToWeb?: boolean;
}

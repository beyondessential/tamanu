import * as yup from 'yup';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.Schema<T>;
  unit?: string;
  highRisk?: boolean;
  defaultValue: T;
  deprecated?: boolean;
  /**
   * When true, this setting is stored encrypted and its value
   * cannot be retrieved via the admin UI - only set to new values.
   */
  secret?: boolean;
}

import * as yup from 'yup';

import type { SettingEditor } from '@tamanu/constants';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.Schema<T>;
  unit?: string;
  highRisk?: boolean;
  /**
   * Required for normal settings; must be omitted for secret settings (a default
   * for a secret would have to live in source control, defeating the point).
   * Enforced at runtime by the schema-level convention test.
   */
  defaultValue?: T;
  deprecated?: boolean;
  /**
   * When true, this setting is stored encrypted and its value
   * cannot be retrieved via the admin UI - only set to new values.
   */
  secret?: boolean;
  exposedToWeb?: boolean;
  exposedToPatientPortal?: boolean;
  editor?: SettingEditor;
}

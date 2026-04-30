import * as yup from 'yup';

import type { SettingEditor } from '@tamanu/constants';

export interface Setting<T = any> {
  name?: string;
  description?: string;
  type: yup.Schema<T>;
  unit?: string;
  highRisk?: boolean;
  defaultValue: T;
  deprecated?: boolean;
  exposedToWeb?: boolean;
  exposedToPatientPortal?: boolean;
  editor?: SettingEditor;
}

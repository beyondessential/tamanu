import * as yup from 'yup';

import { SETTING_EDITORS } from '@tamanu/constants';

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
  editor?: typeof SETTING_EDITORS[keyof typeof SETTING_EDITORS];
}

import * as yup from 'yup';

export const SETTING_EDITORS = {
  MULTILINE: 'multiline',
  MODAL_TEXT: 'modalText',
} as const;

export type SettingEditor = (typeof SETTING_EDITORS)[keyof typeof SETTING_EDITORS];

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

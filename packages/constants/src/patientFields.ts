import keyBy from 'lodash/keyBy';

export const PATIENT_FIELD_DEFINITION_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  SELECT: 'select',
};
export const PATIENT_FIELD_DEFINITION_TYPE_VALUES = Object.values(PATIENT_FIELD_DEFINITION_TYPES);

export const MARITAL_STATUS_OPTIONS = [
  { value: 'Defacto', label: 'De facto' },
  { value: 'Married', label: 'Married' },
  { value: 'Single', label: 'Single' },
  { value: 'Widow', label: 'Widow' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Unknown', label: 'Unknown' },
];

export const SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const SEX_VALUE_INDEX = keyBy(SEX_OPTIONS, 'value');

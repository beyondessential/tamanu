export const PATIENT_FIELD_DEFINITION_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  SELECT: 'select',
};

export const PATIENT_FIELD_DEFINITION_TYPE_VALUES = Object.values(PATIENT_FIELD_DEFINITION_TYPES);

export const MARTIAL_STATUS_VALUES = {
  DEFACTO: 'Defacto',
  MARRIED: 'Married',
  SINGLE: 'Single',
  WIDOW: 'Widow',
  DIVORCED: 'Divorced',
  SEPARATED: 'Separated',
  UNKNOWN: 'Unknown',
};

export const SEX_VALUES = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
};

export const MARTIAL_STATUS_LABELS = {
  [MARTIAL_STATUS_VALUES.DEFACTO]: 'De facto',
  [MARTIAL_STATUS_VALUES.MARRIED]: 'Married',
  [MARTIAL_STATUS_VALUES.SINGLE]: 'Single',
  [MARTIAL_STATUS_VALUES.WIDOW]: 'Widow',
  [MARTIAL_STATUS_VALUES.DIVORCED]: 'Divorced',
  [MARTIAL_STATUS_VALUES.SEPARATED]: 'Separated',
  [MARTIAL_STATUS_VALUES.UNKNOWN]: 'Unknown',
};

export const MARITAL_STATUS_OPTIONS = [
  {
    value: MARTIAL_STATUS_VALUES.DEFACTO,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.DEFACTO],
  },
  {
    value: MARTIAL_STATUS_VALUES.MARRIED,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.MARRIED],
  },
  {
    value: MARTIAL_STATUS_VALUES.SINGLE,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.SINGLE],
  },
  { value: MARTIAL_STATUS_VALUES.WIDOW, label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.WIDOW] },
  {
    value: MARTIAL_STATUS_VALUES.DIVORCED,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.DIVORCED],
  },
  {
    value: MARTIAL_STATUS_VALUES.SEPARATED,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.SEPARATED],
  },
  {
    value: MARTIAL_STATUS_VALUES.UNKNOWN,
    label: MARTIAL_STATUS_LABELS[MARTIAL_STATUS_VALUES.UNKNOWN],
  },
];

export const SEX_LABELS = {
  [SEX_VALUES.MALE]: 'Male',
  [SEX_VALUES.FEMALE]: 'Female',
  [SEX_VALUES.OTHER]: 'Other',
};

export const SEX_OPTIONS = [
  { value: SEX_VALUES.MALE, label: SEX_LABELS[SEX_VALUES.MALE] },
  { value: SEX_VALUES.FEMALE, label: SEX_LABELS[SEX_VALUES.FEMALE] },
  { value: SEX_VALUES.OTHER, label: SEX_LABELS[SEX_VALUES.OTHER] },
];

export const SEX_VALUE_INDEX = SEX_OPTIONS.reduce(
  (dict, option) => ({
    ...dict,
    [option.value]: option,
  }),
  {},
);

// Please keep in sync with:
// - mobile/App/constants/patientFields.ts

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

// TODO: used in BirthNotificationCertificate and can be removed once translations are implemented there
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

export const BLOOD_TYPES = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  AB_NEGATIVE: 'AB-',
  AB_POSITIVE: 'AB+',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
};

export const BLOOD_LABELS = {
  [BLOOD_TYPES.A_POSITIVE]: 'A+',
  [BLOOD_TYPES.A_NEGATIVE]: 'A-',
  [BLOOD_TYPES.AB_NEGATIVE]: 'AB-',
  [BLOOD_TYPES.AB_POSITIVE]: 'AB+',
  [BLOOD_TYPES.B_POSITIVE]: 'B+',
  [BLOOD_TYPES.B_NEGATIVE]: 'B-',
  [BLOOD_TYPES.O_POSITIVE]: 'O+',
  [BLOOD_TYPES.O_NEGATIVE]: 'O-',
};

export const EDUCATIONAL_ATTAINMENT_TYPES = {
  NO_FORMAL_SCHOOLING: 'No formal schooling',
  LESS_THAN_PRIMARY_SCHOOL: 'Less than primary school',
  PRIMARY_SCHOOL_COMPLETED: 'Primary school completed',
  SEC_SCHOOL_COMPLETED: 'Sec school completed',
  HIGH_SCHOOL_COMPLETED: 'High school completed',
  UNIVERSITY_COMPLETED: 'University completed',
  POST_GRAD_COMPLETED: 'Post grad completed',
};

export const EDUCATIONAL_ATTAINMENT_LABELS = {
  [EDUCATIONAL_ATTAINMENT_TYPES.NO_FORMAL_SCHOOLING]: 'No formal schooling',
  [EDUCATIONAL_ATTAINMENT_TYPES.LESS_THAN_PRIMARY_SCHOOL]: 'Less than primary school',
  [EDUCATIONAL_ATTAINMENT_TYPES.PRIMARY_SCHOOL_COMPLETED]: 'Primary school completed',
  [EDUCATIONAL_ATTAINMENT_TYPES.SEC_SCHOOL_COMPLETED]: 'Sec school completed',
  [EDUCATIONAL_ATTAINMENT_TYPES.HIGH_SCHOOL_COMPLETED]: 'High school completed',
  [EDUCATIONAL_ATTAINMENT_TYPES.UNIVERSITY_COMPLETED]: 'University completed',
  [EDUCATIONAL_ATTAINMENT_TYPES.POST_GRAD_COMPLETED]: 'Post grad completed',
};

export const SOCIAL_MEDIA_TYPES = {
  FACEBOOK: 'Facebook',
  INSTAGRAM: 'Instagram',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'Twitter',
  VIBER: 'Viber',
  WHATSAPP: 'WhatsApp',
};

export const SOCIAL_MEDIA_LABELS = {
  [SOCIAL_MEDIA_TYPES.FACEBOOK]: 'Facebook',
  [SOCIAL_MEDIA_TYPES.INSTAGRAM]: 'Instagram',
  [SOCIAL_MEDIA_TYPES.LINKEDIN]: 'LinkedIn',
  [SOCIAL_MEDIA_TYPES.TWITTER]: 'Twitter',
  [SOCIAL_MEDIA_TYPES.VIBER]: 'Viber',
  [SOCIAL_MEDIA_TYPES.WHATSAPP]: 'WhatsApp',
};

export const TITLES = {
  MR: 'Mr',
  MRS: 'Mrs',
  MS: 'Ms',
  MISS: 'Miss',
  DR: 'Dr',
  SR: 'Sr',
  SN: 'Sn',
};

export const TITLE_LABELS = {
  [TITLES.MR]: 'Mr',
  [TITLES.MRS]: 'Mrs',
  [TITLES.MS]: 'Ms',
  [TITLES.MISS]: 'Miss',
  [TITLES.DR]: 'Dr',
  [TITLES.SR]: 'Sr',
  [TITLES.SN]: 'Sn',
};

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

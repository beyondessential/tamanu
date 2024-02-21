import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  DOCUMENT_SOURCES,
  DIAGNOSIS_CERTAINTY,
  ENCOUNTER_LABELS,
  ENCOUNTER_TYPES,
  IMAGING_REQUEST_STATUS_CONFIG,
  IMAGING_REQUEST_STATUS_TYPES,
  INVOICE_PAYMENT_STATUSES,
  INVOICE_STATUSES,
  LAB_REQUEST_STATUS_CONFIG,
  LAB_REQUEST_STATUSES,
  LOCATION_AVAILABILITY_STATUS,
  LOCATION_AVAILABILITY_TAG_CONFIG,
  NOTE_TYPES,
  NOTE_TYPE_LABELS,
  PATIENT_REGISTRY_TYPES,
  REFERRAL_STATUSES,
  REGISTRATION_STATUSES,
  TEMPLATE_TYPES,
} from '@tamanu/constants';

import {
  administrationIcon,
  medicationIcon,
  patientIcon,
  radiologyIcon,
  scheduleIcon,
  vaccineIcon,
} from './images';

export * from './births.js';



export const MUI_SPACING_UNIT = 8;

export const PREGNANCY_PROGRAM_ID = 'program-pregnancy';

export const REALM_DATE_FORMAT = 'YYYY-MM-DD@HH:MM:SS';

export const DB_OBJECTS_MAX_DEPTH = {
  PATIENT_MAIN: 10,
  ENCOUNTER_MAIN: 7,
};

export const PROGRAM_REGISTRATION_STATUS_LABEL = {
  [REGISTRATION_STATUSES.ACTIVE]: 'Active',
  [REGISTRATION_STATUSES.INACTIVE]: 'Removed',
  [REGISTRATION_STATUSES.RECORDED_IN_ERROR]: 'Delete',
};
// Should only be colours that are defined as constants in Figma
// (with the exception of searchTintColor)
export const Colors = {
  primary: '#326699',
  primaryDark: '#2f4358',
  secondary: '#ffcc24',
  alert: '#f76853',
  orange: '#f17f16',
  safe: '#47ca80',
  darkestText: '#444444',
  darkText: '#666666',
  midText: '#888888',
  softText: '#b8b8b8',
  outline: '#dedede',
  softOutline: '#ebebeb',
  background: '#f3f5f7',
  white: '#ffffff',
  offWhite: '#fafafa',
  brightBlue: '#67A6E3',
  blue: '#1172D1',
  veryLightBlue: '#F4F9FF',
  metallicYellow: '#BD9503',
  pink: '#D10580',
  purple: '#4101C9',
  green: '#19934E',
  searchTintColor: '#d2dae3',
  hoverGrey: '#f3f5f7',
};

export const MAX_AUTO_COMPLETE_ITEMS = {
  DIAGNOSES: 10,
};

export const REFERRAL_STATUS_LABELS = {
  [REFERRAL_STATUSES.PENDING]: 'Pending',
  [REFERRAL_STATUSES.CANCELLED]: 'Cancelled',
  [REFERRAL_STATUSES.COMPLETED]: 'Completed',
};

export const BINARY = {
  YES: 'yes',
  NO: 'no',
  UNKNOWN: 'unknown',
};

export const BINARY_LABELS = {
  [BINARY.YES]: 'Yes',
  [BINARY.NO]: 'No',
  [BINARY.UNKNOWN]: 'Unknown',
};

export const BINARY_OPTIONS = [
  { value: BINARY.YES, label: BINARY_LABELS[BINARY.YES] },
  { value: BINARY.NO, label: BINARY_LABELS[BINARY.NO] },
];

export const BINARY_UNKNOWN_OPTIONS = [
  ...BINARY_OPTIONS,
  { value: BINARY.UNKNOWN, label: BINARY_LABELS[BINARY.UNKNOWN] },
];

export const DIAGNOSIS_CERTAINTY_LABELS = {
  [DIAGNOSIS_CERTAINTY.EMERGENCY]: 'ED Diagnosis',
  [DIAGNOSIS_CERTAINTY.SUSPECTED]: 'Suspected',
  [DIAGNOSIS_CERTAINTY.CONFIRMED]: 'Confirmed',
  [DIAGNOSIS_CERTAINTY.DISPROVEN]: 'Disproven',
  [DIAGNOSIS_CERTAINTY.RECORDED_IN_ERROR]: 'Recorded in error',
};

export const DIAGNOSIS_CERTAINTY_OPTIONS = [
  {
    value: DIAGNOSIS_CERTAINTY.EMERGENCY,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.EMERGENCY],
    triageOnly: true,
  },
  {
    value: DIAGNOSIS_CERTAINTY.SUSPECTED,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.SUSPECTED],
  },
  {
    value: DIAGNOSIS_CERTAINTY.CONFIRMED,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.CONFIRMED],
  },
  {
    value: DIAGNOSIS_CERTAINTY.DISPROVEN,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.DISPROVEN],
    editOnly: true,
  },
  {
    value: DIAGNOSIS_CERTAINTY.RECORDED_IN_ERROR,
    label: DIAGNOSIS_CERTAINTY_LABELS[DIAGNOSIS_CERTAINTY.RECORDED_IN_ERROR],
    editOnly: true,
  },
];

export const CERTAINTY_OPTIONS_BY_VALUE = createValueIndex(DIAGNOSIS_CERTAINTY_OPTIONS);

// The order here is how they'll show up in the dropdown
// Treatment plan first and alphabetical after that
export const noteTypes = [
  { value: NOTE_TYPES.TREATMENT_PLAN, label: NOTE_TYPE_LABELS[NOTE_TYPES.TREATMENT_PLAN] },
  { value: NOTE_TYPES.ADMISSION, label: NOTE_TYPE_LABELS[NOTE_TYPES.ADMISSION] },
  {
    value: NOTE_TYPES.CLINICAL_MOBILE,
    label: NOTE_TYPE_LABELS[NOTE_TYPES.CLINICAL_MOBILE],
    hideFromDropdown: true,
  },
  { value: NOTE_TYPES.DIETARY, label: NOTE_TYPE_LABELS[NOTE_TYPES.DIETARY] },

  { value: NOTE_TYPES.DISCHARGE, label: NOTE_TYPE_LABELS[NOTE_TYPES.DISCHARGE] },
  { value: NOTE_TYPES.HANDOVER, label: NOTE_TYPE_LABELS[NOTE_TYPES.HANDOVER] },
  { value: NOTE_TYPES.MEDICAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.MEDICAL] },
  { value: NOTE_TYPES.NURSING, label: NOTE_TYPE_LABELS[NOTE_TYPES.NURSING] },
  { value: NOTE_TYPES.OTHER, label: NOTE_TYPE_LABELS[NOTE_TYPES.OTHER] },
  { value: NOTE_TYPES.PHARMACY, label: NOTE_TYPE_LABELS[NOTE_TYPES.PHARMACY] },
  { value: NOTE_TYPES.PHYSIOTHERAPY, label: NOTE_TYPE_LABELS[NOTE_TYPES.PHYSIOTHERAPY] },
  { value: NOTE_TYPES.SOCIAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.SOCIAL] },
  { value: NOTE_TYPES.SURGICAL, label: NOTE_TYPE_LABELS[NOTE_TYPES.SURGICAL] },
  { value: NOTE_TYPES.SYSTEM, label: NOTE_TYPE_LABELS[NOTE_TYPES.SYSTEM], hideFromDropdown: true },
];

export const encounterOptions = [
  {
    value: ENCOUNTER_TYPES.ADMISSION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.ADMISSION],
    image: medicationIcon,
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.TRIAGE],
    image: patientIcon,
    triageFlowOnly: true,
  },
  {
    value: ENCOUNTER_TYPES.CLINIC,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.CLINIC],
    image: administrationIcon,
  },
  {
    value: ENCOUNTER_TYPES.IMAGING,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.IMAGING],
    image: radiologyIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.EMERGENCY,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.EMERGENCY],
    image: scheduleIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.OBSERVATION],
    image: patientIcon,
    triageFlowOnly: true,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.SURVEY_RESPONSE,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.SURVEY_RESPONSE],
    image: patientIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.VACCINATION,
    label: ENCOUNTER_LABELS[ENCOUNTER_TYPES.VACCINATION],
    image: vaccineIcon,
    hideFromMenu: true,
  },
];

export const ENCOUNTER_OPTIONS_BY_VALUE = createValueIndex(encounterOptions);

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

export const BLOOD_OPTIONS = [
  { value: BLOOD_TYPES.A_POSITIVE, label: BLOOD_LABELS[BLOOD_TYPES.A_POSITIVE] },
  { value: BLOOD_TYPES.A_NEGATIVE, label: BLOOD_LABELS[BLOOD_TYPES.A_NEGATIVE] },
  { value: BLOOD_TYPES.AB_NEGATIVE, label: BLOOD_LABELS[BLOOD_TYPES.AB_NEGATIVE] },
  { value: BLOOD_TYPES.AB_POSITIVE, label: BLOOD_LABELS[BLOOD_TYPES.AB_POSITIVE] },
  { value: BLOOD_TYPES.B_POSITIVE, label: BLOOD_LABELS[BLOOD_TYPES.B_POSITIVE] },
  { value: BLOOD_TYPES.B_NEGATIVE, label: BLOOD_LABELS[BLOOD_TYPES.B_NEGATIVE] },
  { value: BLOOD_TYPES.O_POSITIVE, label: BLOOD_LABELS[BLOOD_TYPES.O_POSITIVE] },
  { value: BLOOD_TYPES.O_NEGATIVE, label: BLOOD_LABELS[BLOOD_TYPES.O_NEGATIVE] },
];

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

export const TITLE_OPTIONS = [
  { value: TITLES.MR, label: TITLE_LABELS[TITLES.MR] },
  { value: TITLES.MRS, label: TITLE_LABELS[TITLES.MRS] },
  { value: TITLES.MS, label: TITLE_LABELS[TITLES.MS] },
  { value: TITLES.MISS, label: TITLE_LABELS[TITLES.MISS] },
  { value: TITLES.DR, label: TITLE_LABELS[TITLES.DR] },
  { value: TITLES.SR, label: TITLE_LABELS[TITLES.SR] },
  { value: TITLES.SN, label: TITLE_LABELS[TITLES.SN] },
];

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

export const SOCIAL_MEDIA_OPTIONS = [
  { value: SOCIAL_MEDIA_TYPES.FACEBOOK, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.FACEBOOK] },
  { value: SOCIAL_MEDIA_TYPES.INSTAGRAM, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.INSTAGRAM] },
  { value: SOCIAL_MEDIA_TYPES.LINKEDIN, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.LINKEDIN] },
  { value: SOCIAL_MEDIA_TYPES.TWITTER, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.TWITTER] },
  { value: SOCIAL_MEDIA_TYPES.VIBER, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.VIBER] },
  { value: SOCIAL_MEDIA_TYPES.WHATSAPP, label: SOCIAL_MEDIA_LABELS[SOCIAL_MEDIA_TYPES.WHATSAPP] },
];

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

export const EDUCATIONAL_ATTAINMENT_OPTIONS = [
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.NO_FORMAL_SCHOOLING,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.NO_FORMAL_SCHOOLING],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.LESS_THAN_PRIMARY_SCHOOL,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.LESS_THAN_PRIMARY_SCHOOL],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.PRIMARY_SCHOOL_COMPLETED,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.PRIMARY_SCHOOL_COMPLETED],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.SEC_SCHOOL_COMPLETED,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.SEC_SCHOOL_COMPLETED],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.HIGH_SCHOOL_COMPLETED,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.HIGH_SCHOOL_COMPLETED],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.UNIVERSITY_COMPLETED,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.UNIVERSITY_COMPLETED],
  },
  {
    value: EDUCATIONAL_ATTAINMENT_TYPES.POST_GRAD_COMPLETED,
    label: EDUCATIONAL_ATTAINMENT_LABELS[EDUCATIONAL_ATTAINMENT_TYPES.POST_GRAD_COMPLETED],
  },
];

export const REPORT_TYPES = {
  PIE_CHART: 'pie-chart',
  BAR_CHART: 'bar-chart',
  LINE_CHART: 'line-graph',
  RAW: 'raw',
  TABLE: 'table',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'apiToken',
  LOCALISATION: 'localisation',
  SERVER: 'server',
  REMEMBER_EMAIL: 'remember-email',
  PERMISSIONS: 'permissions',
  ROLE: 'role',
  LANGUAGE: 'language',
};

// TODO: Need to think about these ones more
export const appointmentTypeOptions = Object.values(APPOINTMENT_TYPES).map(type => ({
  label: type,
  value: type,
}));

export const appointmentStatusOptions = Object.values(APPOINTMENT_STATUSES).map(status => ({
  label: status,
  value: status,
}));

export const locationAvailabilityOptions = [
  { value: '', label: 'All' },
  ...Object.keys(LOCATION_AVAILABILITY_STATUS).map(status => ({
    value: status,
    label: LOCATION_AVAILABILITY_TAG_CONFIG[status].label,
  })),
];

export const IMAGING_REQUEST_STATUS_OPTIONS = Object.values(IMAGING_REQUEST_STATUS_TYPES)
  .filter(
    type =>
      ![
        IMAGING_REQUEST_STATUS_TYPES.DELETED,
        IMAGING_REQUEST_STATUS_TYPES.ENTERED_IN_ERROR,
        IMAGING_REQUEST_STATUS_TYPES.CANCELLED,
      ].includes(type),
  )
  .map(type => ({
    label: IMAGING_REQUEST_STATUS_CONFIG[type].label,
    value: type,
  }));

export const LAB_REQUEST_STATUS_OPTIONS = Object.values(LAB_REQUEST_STATUSES)
  .filter(
    status =>
      ![
        LAB_REQUEST_STATUSES.DELETED,
        LAB_REQUEST_STATUSES.ENTERED_IN_ERROR,
        LAB_REQUEST_STATUSES.CANCELLED,
      ].includes(status),
  )
  .map(status => ({
    label: LAB_REQUEST_STATUS_CONFIG[status].label,
    value: status,
  }));

export const ALPHABET_FOR_ID =
  // this is absolutely fine and the concat isn't useless
  // eslint-disable-next-line no-useless-concat
  'ABCDEFGH' + /* I */ 'JK' + /* L */ 'MN' + /* O */ 'PQRSTUVWXYZ' + /* 01 */ '23456789';

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.IN_PROGRESS]: 'In progress',
  [INVOICE_STATUSES.FINALISED]: 'Finalised',
};

export const INVOICE_STATUS_OPTIONS = [
  {
    value: INVOICE_STATUSES.CANCELLED,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.CANCELLED],
  },
  {
    value: INVOICE_STATUSES.IN_PROGRESS,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.IN_PROGRESS],
  },
  {
    value: INVOICE_STATUSES.FINALISED,
    label: INVOICE_STATUS_LABELS[INVOICE_STATUSES.FINALISED],
  },
];

export const INVOICE_STATUS_COLORS = {
  [INVOICE_STATUSES.CANCELLED]: '#FFCC24',
  [INVOICE_STATUSES.IN_PROGRESS]: '#F76853',
  [INVOICE_STATUSES.FINALISED]: '#47CA80',
};

export const INVOICE_PAYMENT_STATUS_LABELS = {
  [INVOICE_PAYMENT_STATUSES.UNPAID]: 'Unpaid',
  [INVOICE_PAYMENT_STATUSES.PAID]: 'Paid',
};

export const INVOICE_PAYMENT_STATUS_OPTIONS = [
  {
    value: INVOICE_PAYMENT_STATUSES.UNPAID,
    label: INVOICE_PAYMENT_STATUS_LABELS[INVOICE_PAYMENT_STATUSES.UNPAID],
  },
  {
    value: INVOICE_PAYMENT_STATUSES.PAID,
    label: INVOICE_PAYMENT_STATUS_LABELS[INVOICE_PAYMENT_STATUSES.PAID],
  },
];

export const PATIENT_REGISTRY_LABELS = {
  [PATIENT_REGISTRY_TYPES.NEW_PATIENT]: 'Create new patient',
  [PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY]: 'Register birth',
};

export const PATIENT_REGISTRY_OPTIONS = [
  {
    value: PATIENT_REGISTRY_TYPES.NEW_PATIENT,
    label: PATIENT_REGISTRY_LABELS[PATIENT_REGISTRY_TYPES.NEW_PATIENT],
  },
  {
    value: PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY,
    label: PATIENT_REGISTRY_LABELS[PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY],
  },
];

export const TEMPLATE_TYPE_LABELS = {
  [TEMPLATE_TYPES.PATIENT_LETTER]: 'Patient Letter',
};

export const TEMPLATE_TYPE_OPTIONS = [
  {
    value: TEMPLATE_TYPES.PATIENT_LETTER,
    label: TEMPLATE_TYPE_LABELS[TEMPLATE_TYPES.PATIENT_LETTER],
  },
];

export const PATIENT_STATUS = {
  INPATIENT: 'Inpatient',
  OUTPATIENT: 'Outpatient',
  EMERGENCY: 'Emergency',
  DECEASED: 'Deceased',
};

export const FORM_STATUSES = {
  SUBMIT_ATTEMPTED: 'SUBMIT_ATTEMPTED',
};

export const DOCUMENT_SOURCE_LABELS = {
  [DOCUMENT_SOURCES.PATIENT_LETTER]: 'Patient Letter',
  [DOCUMENT_SOURCES.UPLOADED]: 'Uploaded',
};

export const SUPPORTED_DOCUMENT_TYPES = {
  PDF: 'application/pdf',
  JPEG: 'image/jpeg',
};

export const REQUIRED_INLINE_ERROR_MESSAGE = '*Required';

export const FORM_TYPES = {
  SEARCH_FORM: 'searchForm',
  DATA_FORM: 'dataForm',
};

export const NOTE_FORM_MODES = {
  CREATE_NOTE: 'createNote',
  EDIT_NOTE: 'editNote',
  VIEW_NOTE: 'viewNote',
};

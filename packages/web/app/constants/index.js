import { capitalize } from 'lodash';
import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  DOCUMENT_SOURCES,
  ENCOUNTER_TYPES,
  ENCOUNTER_LABELS,
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

export const MUI_SPACING_UNIT = 8;

export const PREGNANCY_PROGRAM_ID = 'program-pregnancy';

export const REALM_DATE_FORMAT = 'YYYY-MM-DD@HH:MM:SS';

export const DB_OBJECTS_MAX_DEPTH = {
  PATIENT_MAIN: 10,
  ENCOUNTER_MAIN: 7,
};

// Please keep in sync with packages/mobile/App/constants/programRegistries.ts
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

export const columnStyle = {
  backgroundColor: Colors.white,
  height: '60px',
  color: Colors.primaryDark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const columnStyleSlim = {
  backgroundColor: Colors.white,
  height: '40px',
  color: Colors.primaryDark,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const headerStyle = {
  backgroundColor: Colors.searchTintColor,
};

export const medicationStatuses = {
  COMPLETED: 'Completed',
  FULFILLED: 'Fulfilled',
  REQUESTED: 'Requested',
};

export const binaryOptions = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

export const binaryUnknownOptions = [...binaryOptions, { value: 'unknown', label: 'Unknown' }];

export const locationOptions = [
  {
    value: 'australian-capital-territory',
    label: 'Australian Capital Territory',
    className: 'State-ACT',
  },
  { value: 'new-south-wales', label: 'New South Wales', className: 'State-NSW' },
  { value: 'victoria', label: 'Victoria', className: 'State-Vic' },
  { value: 'queensland', label: 'Queensland', className: 'State-Qld' },
  { value: 'western-australia', label: 'Western Australia', className: 'State-WA' },
  { value: 'south-australia', label: 'South Australia', className: 'State-SA' },
  { value: 'tasmania', label: 'Tasmania', className: 'State-Tas' },
  { value: 'northern-territory', label: 'Northern Territory', className: 'State-NT' },
];

export const reportOptions = [
  { value: 'detailedAdmissions', label: 'Admissions Detail', className: 'State-ACT' },
  { value: 'admissions', label: 'Admissions Summary', className: 'State-NSW' },
  { value: 'diagnostic', label: 'Diagnostic Testing', className: 'State-Vic' },
  { value: 'detailedDischarges', label: 'Discharges Detail', className: 'State-Qld' },
  { value: 'discharges', label: 'Discharges Summary', className: 'State-WA' },
  { value: 'detailedProcedures', label: 'Procedures Detail', className: 'State-SA' },
  { value: 'procedures', label: 'Procedures Summary', className: 'State-Tas' },
  { value: 'status', label: 'Patient Status', className: 'State-NT' },
  { value: 'patientDays', label: 'Total Patient Days', className: 'State-NT' },
  { value: 'detailedPatientDays', label: 'Total Patient Days (Detailed)', className: 'State-NT' },
  { value: 'encounter', label: 'Encounter', className: 'State-NT' },
];

export const diagnosisCertaintyOptions = [
  { value: 'emergency', label: 'ED Diagnosis', triageOnly: true },
  { value: 'suspected', label: 'Suspected' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'disproven', label: 'Disproven', editOnly: true },
  { value: 'error', label: 'Recorded in error', editOnly: true },
];

export const CERTAINTY_OPTIONS_BY_VALUE = createValueIndex(diagnosisCertaintyOptions);

export const nonEmergencyDiagnosisCertaintyOptions = diagnosisCertaintyOptions.filter(
  x => x.value !== CERTAINTY_OPTIONS_BY_VALUE.emergency.value,
);

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

export const operativePlanStatuses = {
  PLANNED: 'planned',
  DROPPED: 'dropped',
  COMPLETED: 'completed',
};

export const operativePlanStatusList = Object.values(operativePlanStatuses).map(status => ({
  value: status,
  label: capitalize(status),
}));

export const bloodOptions = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'AB-', label: 'AB-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

export const titleOptions = [
  { value: 'Mr', label: 'Mr' },
  { value: 'Mrs', label: 'Mrs' },
  { value: 'Ms', label: 'Ms' },
  { value: 'Miss', label: 'Miss' },
  { value: 'Dr', label: 'Dr' },
  { value: 'Sr', label: 'Sr' },
  { value: 'Sn', label: 'Sn' },
];

export const socialMediaOptions = [
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'Twitter', label: 'Twitter' },
  { value: 'Viber', label: 'Viber' },
  { value: 'WhatsApp', label: 'WhatsApp' },
];

export const educationalAttainmentOptions = [
  { value: 'No formal schooling', label: 'No formal schooling' },
  { value: 'Less than primary school', label: 'Less than primary school' },
  { value: 'Primary school completed', label: 'Primary school completed' },
  { value: 'Sec school completed', label: 'Sec school completed' },
  { value: 'High school completed', label: 'High school completed' },
  { value: 'University completed', label: 'University completed' },
  { value: 'Post grad completed', label: 'Post grad completed' },
];

export const pregnancyOutcomes = [
  { value: '', label: 'N/A' },
  { value: 'liveBirth', label: 'Live Birth' },
  { value: 'stillBirth', label: 'Still Birth' },
  { value: 'fetalDeath', label: 'Fetal Death' },
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
};

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

export const INVOICE_STATUS_OPTIONS = [
  { label: 'Cancelled', value: INVOICE_STATUSES.CANCELLED },
  { label: 'In progress', value: INVOICE_STATUSES.IN_PROGRESS },
  { label: 'Finalised', value: INVOICE_STATUSES.FINALISED },
];

export const INVOICE_STATUS_LABELS = {
  [INVOICE_STATUSES.CANCELLED]: 'Cancelled',
  [INVOICE_STATUSES.IN_PROGRESS]: 'In progress',
  [INVOICE_STATUSES.FINALISED]: 'Finalised',
};

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
  { label: 'Unpaid', value: INVOICE_PAYMENT_STATUSES.UNPAID },
  { label: 'Paid', value: INVOICE_PAYMENT_STATUSES.PAID },
];

export const PATIENT_REGISTRY_OPTIONS = [
  { value: PATIENT_REGISTRY_TYPES.NEW_PATIENT, label: 'Create new patient' },
  { value: PATIENT_REGISTRY_TYPES.BIRTH_REGISTRY, label: 'Register birth' },
];

export const TEMPLATE_TYPE_OPTIONS = [
  { value: TEMPLATE_TYPES.PATIENT_LETTER, label: 'Patient Letter' },
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

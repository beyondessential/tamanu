import { capitalize } from 'lodash';
import React from 'react';

import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import {
  ENCOUNTER_TYPES,
  NOTE_TYPES,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  REFERRAL_STATUSES,
  INVOICE_STATUSES,
  INVOICE_PAYMENT_STATUSES,
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PLACE_OF_BIRTH_TYPES,
  ATTENDANT_OF_BIRTH_TYPES,
  IMAGING_REQUEST_STATUS_CONFIG,
  IMAGING_REQUEST_STATUS_TYPES,
  LAB_REQUEST_STATUS_CONFIG,
  LAB_REQUEST_STATUSES,
  LOCATION_AVAILABILITY_STATUS,
  LOCATION_AVAILABILITY_TAG_CONFIG,
  DOCUMENT_SOURCES,
  TEMPLATE_TYPES,
} from '@tamanu/constants';

import {
  medicationIcon,
  administrationIcon,
  radiologyIcon,
  scheduleIcon,
  patientIcon,
  vaccineIcon,
} from './images';
import { TranslatedText } from '../components/Translation/TranslatedText';

export const MUI_SPACING_UNIT = 8;

export const PREGNANCY_PROGRAM_ID = 'program-pregnancy';

export const REALM_DATE_FORMAT = 'YYYY-MM-DD@HH:MM:SS';

export const DB_OBJECTS_MAX_DEPTH = {
  PATIENT_MAIN: 10,
  ENCOUNTER_MAIN: 7,
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
  { value: NOTE_TYPES.TREATMENT_PLAN, label: 'Treatment plan' },
  { value: NOTE_TYPES.ADMISSION, label: 'Admission' },
  { value: NOTE_TYPES.CLINICAL_MOBILE, label: 'Clinical note (mobile)', hideFromDropdown: true },
  { value: NOTE_TYPES.DIETARY, label: 'Dietary' },
  { value: NOTE_TYPES.DISCHARGE, label: 'Discharge planning' },
  { value: NOTE_TYPES.HANDOVER, label: 'Handover note' },
  { value: NOTE_TYPES.MEDICAL, label: 'Medical' },
  { value: NOTE_TYPES.NURSING, label: 'Nursing' },
  { value: NOTE_TYPES.OTHER, label: 'Other' },
  { value: NOTE_TYPES.PHARMACY, label: 'Pharmacy' },
  { value: NOTE_TYPES.PHYSIOTHERAPY, label: 'Physiotherapy' },
  { value: NOTE_TYPES.SOCIAL, label: 'Social welfare' },
  { value: NOTE_TYPES.SURGICAL, label: 'Surgical' },
  { value: NOTE_TYPES.SYSTEM, label: 'System', hideFromDropdown: true },
];

export const NOTE_TYPE_LABELS = Object.fromEntries(
  noteTypes.map(noteType => [noteType.value, noteType.label]),
);

export const encounterOptions = [
  { value: ENCOUNTER_TYPES.ADMISSION, label: 'Hospital admission', image: medicationIcon },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    label: 'Triage',
    image: patientIcon,
    triageFlowOnly: true,
  },
  { value: ENCOUNTER_TYPES.CLINIC, label: 'Clinic', image: administrationIcon },
  { value: ENCOUNTER_TYPES.IMAGING, label: 'Imaging', image: radiologyIcon, hideFromMenu: true },
  {
    value: ENCOUNTER_TYPES.EMERGENCY,
    label: 'Emergency short stay',
    image: scheduleIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    label: 'Active ED patient',
    image: patientIcon,
    triageFlowOnly: true,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.SURVEY_RESPONSE,
    label: 'Survey response',
    image: patientIcon,
    hideFromMenu: true,
  },
  {
    value: ENCOUNTER_TYPES.VACCINATION,
    label: 'Vaccination record',
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
  {
    value: 'A+',
    label: <TranslatedText stringId="patient.form.bloodType.option.a+" fallback="A+" />,
  },
  {
    value: 'A-',
    label: <TranslatedText stringId="patient.form.bloodType.option.a-" fallback="A-" />,
  },
  {
    value: 'AB-',
    label: <TranslatedText stringId="patient.form.bloodType.option.ab-" fallback="AB-" />,
  },
  {
    value: 'AB+',
    label: <TranslatedText stringId="patient.form.bloodType.option.ab+" fallback="AB+" />,
  },
  {
    value: 'B+',
    label: <TranslatedText stringId="patient.form.bloodType.option.b+" fallback="B+" />,
  },
  {
    value: 'B-',
    label: <TranslatedText stringId="patient.form.bloodType.option.b-" fallback="B-" />,
  },
  {
    value: 'O+',
    label: <TranslatedText stringId="patient.form.bloodType.option.o+" fallback="O+" />,
  },
  {
    value: 'O-',
    label: <TranslatedText stringId="patient.form.bloodType.option.o-" fallback="O-" />,
  },
];

export const sexOptions = [
  {
    value: 'male',
    label: <TranslatedText stringId="patient.form.sex.option.male" fallback="Male" />,
  },
  {
    value: 'female',
    label: <TranslatedText stringId="patient.form.sex.option.female" fallback="Female" />,
  },
  {
    value: 'other',
    label: <TranslatedText stringId="patient.form.sex.option.other" fallback="Other" />,
  },
];

export const titleOptions = [
  {
    value: 'Mr',
    label: <TranslatedText stringId="patient.form.title.option.mr" fallback="Mr" />,
  },
  {
    value: 'Mrs',
    label: <TranslatedText stringId="patient.form.title.option.mr" fallback="Mrs" />,
  },
  { value: 'Ms', label: <TranslatedText stringId="patient.form.title.option.ms" fallback="Ms" /> },
  {
    value: 'Miss',
    label: <TranslatedText stringId="patient.form.title.option.miss" fallback="Miss" />,
  },
  { value: 'Dr', label: <TranslatedText stringId="patient.form.title.option.dr" fallback="Dr" /> },
  { value: 'Sr', label: <TranslatedText stringId="patient.form.title.option.sr" fallback="Sr" /> },
  { value: 'Sn', label: <TranslatedText stringId="patient.form.title.option.sn" fallback="Sn" /> },
];

export const socialMediaOptions = [
  {
    value: 'Facebook',
    label: (
      <TranslatedText stringId="patient.form.socialMedia.option.facebook" fallback="Facebook" />
    ),
  },
  {
    value: 'Instagram',
    label: (
      <TranslatedText stringId="patient.form.socialMedia.option.instagram" fallback="Instagram" />
    ),
  },
  {
    value: 'LinkedIn',
    label: (
      <TranslatedText stringId="patient.form.socialMedia.option.linkedIn" fallback="LinkedIn" />
    ),
  },
  {
    value: 'Twitter',
    label: <TranslatedText stringId="patient.form.socialMedia.option.twitter" fallback="Twitter" />,
  },
  {
    value: 'Viber',
    label: <TranslatedText stringId="patient.form.socialMedia.option.viber" fallback="Viber" />,
  },
  {
    value: 'WhatsApp',
    label: (
      <TranslatedText stringId="patient.form.socialMedia.option.whatsApp" fallback="WhatsApp" />
    ),
  },
];

export const maritalStatusOptions = [
  {
    value: 'Defacto',
    label: (
      <TranslatedText stringId="patient.form.maritalStatus.option.defacto" fallback="De facto" />
    ),
  },
  {
    value: 'Married',
    label: (
      <TranslatedText stringId="patient.form.maritalStatus.option.married" fallback="Married" />
    ),
  },
  {
    value: 'Single',
    label: <TranslatedText stringId="patient.form.maritalStatus.option.single" fallback="Single" />,
  },
  {
    value: 'Widow',
    label: <TranslatedText stringId="patient.form.maritalStatus.option.widow" fallback="Widow" />,
  },
  {
    value: 'Divorced',
    label: (
      <TranslatedText stringId="patient.form.maritalStatus.option.divorced" fallback="Divorced" />
    ),
  },
  {
    value: 'Separated',
    label: (
      <TranslatedText stringId="patient.form.maritalStatus.option.separated" fallback="Separated" />
    ),
  },
  {
    value: 'Unknown',
    label: (
      <TranslatedText stringId="patient.form.maritalStatus.option.unknown" fallback="Unknown" />
    ),
  },
];

export const educationalAttainmentOptions = [
  {
    value: 'No formal schooling',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.noFormalSchooling"
        fallback="No formal schooling"
      />
    ),
  },
  {
    value: 'Less than primary school',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.lessThanPrimary"
        fallback="Less than primary"
      />
    ),
  },
  {
    value: 'Primary school completed',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.primaryCompleted"
        fallback="Primary school completed"
      />
    ),
  },
  {
    value: 'Sec school completed',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.secSchoolCompleted"
        fallback="Sec school completed"
      />
    ),
  },
  {
    value: 'High school completed',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.highSchoolCompleted"
        fallback="High school completed"
      />
    ),
  },
  {
    value: 'University completed',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.universityCompleted"
        fallback="University completed"
      />
    ),
  },
  {
    value: 'Post grad completed',
    label: (
      <TranslatedText
        stringId="patient.form.educationalAttainments.option.postGradCompleted"
        fallback="Post grad completed"
      />
    ),
  },
];

export const SEX_VALUE_INDEX = createValueIndex(sexOptions);

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
  HOST: 'host',
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

export const BIRTH_DELIVERY_TYPE_OPTIONS = [
  {
    value: BIRTH_DELIVERY_TYPES.NORMAL_VAGINAL_DELIVERY,
    label: (
      <TranslatedText
        stringId="birth.form.deliveryType.options.normalVaginalDelivery"
        fallback="Normal vaginal delivery"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.BREECH,
    label: <TranslatedText stringId="birth.form.deliveryType.options.breech" fallback="Breech" />,
  },
  {
    value: BIRTH_DELIVERY_TYPES.EMERGENCY_C_SECTION,
    label: (
      <TranslatedText
        stringId="birth.form.deliveryType.options.emergencyCSection"
        fallback="Emergency C-section"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.ELECTIVE_C_SECTION,
    label: (
      <TranslatedText
        stringId="birth.form.deliveryType.options.electiveCSection"
        fallback="Elective C-section"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.VACUUM_EXTRACTION,
    label: (
      <TranslatedText
        stringId="birth.form.deliveryType.options.vacuumExtraction"
        fallback="Vacuum extraction"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.FORCEPS,
    label: <TranslatedText stringId="birth.form.deliveryType.options.forceps" fallback="Forceps" />,
  },
  {
    value: BIRTH_DELIVERY_TYPES.OTHER,
    label: <TranslatedText stringId="birth.form.deliveryType.options.other" fallback="Other" />,
  },
];

export const BIRTH_TYPE_OPTIONS = [
  { value: BIRTH_TYPES.SINGLE, label: 'Single' },
  { value: BIRTH_TYPES.PLURAL, label: 'Plural' },
];

export const PLACE_OF_BIRTH_OPTIONS = [
  { value: PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY, label: 'Health facility' },
  { value: PLACE_OF_BIRTH_TYPES.HOME, label: 'Home' },
  { value: PLACE_OF_BIRTH_TYPES.OTHER, label: 'Other' },
];

export const ATTENDANT_OF_BIRTH_OPTIONS = [
  { value: ATTENDANT_OF_BIRTH_TYPES.DOCTOR, label: 'Doctor' },
  { value: ATTENDANT_OF_BIRTH_TYPES.MIDWIFE, label: 'Midwife' },
  { value: ATTENDANT_OF_BIRTH_TYPES.NURSE, label: 'Nurse' },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.TRADITIONAL_BIRTH_ATTENDANT,
    label: 'Traditional birth attendant',
  },
  { value: ATTENDANT_OF_BIRTH_TYPES.OTHER, label: 'Other' },
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

export const DRUG_ROUTE_VALUE_TO_LABEL = {
  dermal: 'Dermal',
  ear: 'Ear',
  eye: 'Eye',
  intramuscular: 'IM',
  intravenous: 'IV',
  inhaled: 'Inhaled',
  nasal: 'Nasal',
  oral: 'Oral',
  rectal: 'Rectal',
  subcutaneous: 'S/C',
  sublingual: 'Sublingual',
  topical: 'Topical',
  vaginal: 'Vaginal',
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

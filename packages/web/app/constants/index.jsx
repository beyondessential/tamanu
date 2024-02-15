import { capitalize } from 'lodash';
import React from 'react';

// TODO: This file shouldnt contain any TranslatedText components or be jsx. We did it this way initially but
// part way through development realised that this is a bad pattern and have come up with a better solution.
// Will be addressed in upcoming constants pr NASS-952

import { createValueIndex } from '@tamanu/shared/utils/valueIndex';
import {
  APPOINTMENT_STATUSES,
  BIRTH_DELIVERY_TYPES,
  BIRTH_TYPES,
  PLACE_OF_BIRTH_TYPES,
  ATTENDANT_OF_BIRTH_TYPES,
  APPOINTMENT_TYPES,
  DOCUMENT_SOURCES,
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
import { TranslatedText } from '../components/Translation/TranslatedText';

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
  {
    value: 'emergency',
    label: (
      <TranslatedText stringId="diagnosis.certainty.option.edDiagnosis" fallback="ED Diagnosis" />
    ),
    triageOnly: true,
  },
  {
    value: 'suspected',
    label: <TranslatedText stringId="diagnosis.certainty.option.suspected" fallback="Suspected" />,
  },
  {
    value: 'confirmed',
    label: <TranslatedText stringId="diagnosis.certainty.option.confirmed" fallback="Confirmed" />,
  },
  {
    value: 'disproven',
    label: <TranslatedText stringId="diagnosis.certainty.option.disproven" fallback="Disproven" />,
    editOnly: true,
  },
  {
    value: 'error',
    label: (
      <TranslatedText
        stringId="diagnosis.certainty.option.recordedInError"
        fallback="Recorded in error"
      />
    ),
    editOnly: true,
  },
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
  {
    value: 'A+',
    label: <TranslatedText stringId="patient.property.bloodType.a+" fallback="A+" />,
  },
  {
    value: 'A-',
    label: <TranslatedText stringId="patient.property.bloodType.a-" fallback="A-" />,
  },
  {
    value: 'AB-',
    label: <TranslatedText stringId="patient.property.bloodType.ab-" fallback="AB-" />,
  },
  {
    value: 'AB+',
    label: <TranslatedText stringId="patient.property.bloodType.ab+" fallback="AB+" />,
  },
  {
    value: 'B+',
    label: <TranslatedText stringId="patient.property.bloodType.b+" fallback="B+" />,
  },
  {
    value: 'B-',
    label: <TranslatedText stringId="patient.property.bloodType.b-" fallback="B-" />,
  },
  {
    value: 'O+',
    label: <TranslatedText stringId="patient.property.bloodType.o+" fallback="O+" />,
  },
  {
    value: 'O-',
    label: <TranslatedText stringId="patient.property.bloodType.o-" fallback="O-" />,
  },
];

export const titleOptions = [
  {
    value: 'Mr',
    label: <TranslatedText stringId="patient.property.title.mr" fallback="Mr" />,
  },
  {
    value: 'Mrs',
    label: <TranslatedText stringId="patient.property.title.mr" fallback="Mrs" />,
  },
  {
    value: 'Ms',
    label: <TranslatedText stringId="patient.property.title.ms" fallback="Ms" />,
  },
  {
    value: 'Miss',
    label: <TranslatedText stringId="patient.property.title.miss" fallback="Miss" />,
  },
  {
    value: 'Dr',
    label: <TranslatedText stringId="patient.property.title.dr" fallback="Dr" />,
  },
  {
    value: 'Sr',
    label: <TranslatedText stringId="patient.property.title.sr" fallback="Sr" />,
  },
  {
    value: 'Sn',
    label: <TranslatedText stringId="patient.property.title.sn" fallback="Sn" />,
  },
];

export const socialMediaOptions = [
  {
    value: 'Facebook',
    label: <TranslatedText stringId="patient.property.socialMedia.facebook" fallback="Facebook" />,
  },
  {
    value: 'Instagram',
    label: (
      <TranslatedText stringId="patient.property.socialMedia.instagram" fallback="Instagram" />
    ),
  },
  {
    value: 'LinkedIn',
    label: <TranslatedText stringId="patient.property.socialMedia.linkedIn" fallback="LinkedIn" />,
  },
  {
    value: 'Twitter',
    label: <TranslatedText stringId="patient.property.socialMedia.twitter" fallback="Twitter" />,
  },
  {
    value: 'Viber',
    label: <TranslatedText stringId="patient.property.socialMedia.viber" fallback="Viber" />,
  },
  {
    value: 'WhatsApp',
    label: <TranslatedText stringId="patient.property.socialMedia.whatsApp" fallback="WhatsApp" />,
  },
];

export const educationalAttainmentOptions = [
  {
    value: 'No formal schooling',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.noFormalSchooling"
        fallback="No formal schooling"
      />
    ),
  },
  {
    value: 'Less than primary school',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.lessThanPrimary"
        fallback="Less than primary"
      />
    ),
  },
  {
    value: 'Primary school completed',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.primaryCompleted"
        fallback="Primary school completed"
      />
    ),
  },
  {
    value: 'Sec school completed',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.secSchoolCompleted"
        fallback="Sec school completed"
      />
    ),
  },
  {
    value: 'High school completed',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.highSchoolCompleted"
        fallback="High school completed"
      />
    ),
  },
  {
    value: 'University completed',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.universityCompleted"
        fallback="University completed"
      />
    ),
  },
  {
    value: 'Post grad completed',
    label: (
      <TranslatedText
        stringId="patient.property.educationalAttainment.postGradCompleted"
        fallback="Post grad completed"
      />
    ),
  },
];

export const pregnancyOutcomes = [
  { value: '', label: 'N/A' },
  {
    value: 'liveBirth',
    label: (
      <TranslatedText stringId="birth.property.pregnancyOutcome.liveBirth" fallback="Live birth" />
    ),
  },
  {
    value: 'stillBirth',
    label: (
      <TranslatedText
        stringId="birth.property.pregnancyOutcome.stillBirth"
        fallback="Still birth"
      />
    ),
  },
  {
    value: 'fetalDeath',
    label: (
      <TranslatedText
        stringId="birth.property.pregnancyOutcome.fetalDeath"
        fallback="Fetal death"
      />
    ),
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
        stringId="birth.property.deliveryType.normalVaginalDelivery"
        fallback="Normal vaginal delivery"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.BREECH,
    label: <TranslatedText stringId="birth.property.deliveryType.breech" fallback="Breech" />,
  },
  {
    value: BIRTH_DELIVERY_TYPES.EMERGENCY_C_SECTION,
    label: (
      <TranslatedText
        stringId="birth.property.deliveryType.emergencyCSection"
        fallback="Emergency C-section"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.ELECTIVE_C_SECTION,
    label: (
      <TranslatedText
        stringId="birth.property.deliveryType.electiveCSection"
        fallback="Elective C-section"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.VACUUM_EXTRACTION,
    label: (
      <TranslatedText
        stringId="birth.property.deliveryType.vacuumExtraction"
        fallback="Vacuum extraction"
      />
    ),
  },
  {
    value: BIRTH_DELIVERY_TYPES.FORCEPS,
    label: <TranslatedText stringId="birth.property.deliveryType.forceps" fallback="Forceps" />,
  },
  {
    value: BIRTH_DELIVERY_TYPES.OTHER,
    label: <TranslatedText stringId="birth.property.deliveryType.other" fallback="Other" />,
  },
];

export const BIRTH_TYPE_OPTIONS = [
  {
    value: BIRTH_TYPES.SINGLE,
    label: <TranslatedText stringId="birth.property.birthType.single" fallback="Single" />,
  },
  {
    value: BIRTH_TYPES.PLURAL,
    label: <TranslatedText stringId="birth.property.birthType.plural" fallback="Plural" />,
  },
];

export const PLACE_OF_BIRTH_OPTIONS = [
  {
    value: PLACE_OF_BIRTH_TYPES.HEALTH_FACILITY,
    label: (
      <TranslatedText
        stringId="birth.property.placeOfBirth.healthFacility"
        fallback="Health facility"
      />
    ),
  },
  {
    value: PLACE_OF_BIRTH_TYPES.HOME,
    label: <TranslatedText stringId="birth.property.placeOfBirth.home" fallback="Home" />,
  },
  {
    value: PLACE_OF_BIRTH_TYPES.OTHER,
    label: <TranslatedText stringId="birth.property.placeOfBirth.other" fallback="Other" />,
  },
];

export const ATTENDANT_OF_BIRTH_OPTIONS = [
  {
    value: ATTENDANT_OF_BIRTH_TYPES.DOCTOR,
    label: <TranslatedText stringId="birth.property.attendantOfBirth.doctor" fallback="Doctor" />,
  },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.MIDWIFE,
    label: <TranslatedText stringId="birth.property.attendantOfBirth.midwife" fallback="Midwife" />,
  },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.NURSE,
    label: <TranslatedText stringId="birth.property.attendantOfBirth.nurse" fallback="Nurse" />,
  },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.TRADITIONAL_BIRTH_ATTENDANT,
    label: (
      <TranslatedText
        stringId="birth.property.attendantOfBirth.traditionalBirthAttendant"
        fallback="Traditional birth attendant"
      />
    ),
  },
  {
    value: ATTENDANT_OF_BIRTH_TYPES.OTHER,
    label: <TranslatedText stringId="birth.property.attendantOfBirth.other" fallback="Other" />,
  },
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
  READ_ONLY_FORM: 'readOnlyForm',
  CREDENTIALS_FORM: 'credentialsForm',
  SEARCH_FORM: 'searchForm',
  EDIT_FORM: 'editForm',
  CREATE_FORM: 'createForm',
  SURVEY_FORM: 'surveyForm',
};

export const DATA_FORM_TYPES =[FORM_TYPES.EDIT_FORM, FORM_TYPES.CREATE_FORM];

export const NOTE_FORM_MODES = {
  CREATE_NOTE: 'createNote',
  EDIT_NOTE: 'editNote',
  VIEW_NOTE: 'viewNote',
};

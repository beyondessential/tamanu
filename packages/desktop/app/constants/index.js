import moment from 'moment';
import { padStart, capitalize } from 'lodash';

import { createValueIndex } from 'shared/utils/valueIndex';
import { ENCOUNTER_TYPES, IMAGING_REQUEST_STATUS_TYPES, NOTE_TYPES } from 'shared/constants';
import {
  medicationIcon,
  administrationIcon,
  radiologyIcon,
  scheduleIcon,
  patientIcon,
} from './images';

export const MUI_SPACING_UNIT = 8;

export const REMEMBER_EMAIL_KEY = 'remember-email';

export const DISPLAY_ID_PLACEHOLDER = '-TMP-';

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
  safe: '#47ca80',
  darkestText: '#444444',
  darkText: '#666666',
  midText: '#888888',
  softText: '#b8b8b8',
  outline: '#dedede',
  background: '#f3f5f7',
  white: '#ffffff',
  offWhite: '#fafafa',
  brightBlue: '#67A6E3',
  searchTintColor: '#d2dae3',
};

export const MAX_AUTO_COMPLETE_ITEMS = {
  DIAGNOSES: 10,
};

export const LAB_REQUEST_STATUSES = {
  RECEPTION_PENDING: 'reception_pending',
  RESULTS_PENDING: 'results_pending',
  TO_BE_VERIFIED: 'to_be_verified',
  VERIFIED: 'verified',
  PUBLISHED: 'published',
};

export const LAB_REQUEST_STATUS_LABELS = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: 'Reception pending',
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: 'Results pending',
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: 'To be verified',
  [LAB_REQUEST_STATUSES.VERIFIED]: 'Verified',
  [LAB_REQUEST_STATUSES.PUBLISHED]: 'Published',
};

export const LAB_REQUEST_COLORS = {
  [LAB_REQUEST_STATUSES.RECEPTION_PENDING]: '#faa',
  [LAB_REQUEST_STATUSES.RESULTS_PENDING]: '#aaf',
  [LAB_REQUEST_STATUSES.TO_BE_VERIFIED]: '#caf',
  [LAB_REQUEST_STATUSES.VERIFIED]: '#5af',
  [LAB_REQUEST_STATUSES.PUBLISHED]: '#afa',
  unknown: '#333',
};

export const IMAGING_REQUEST_STATUS_LABELS = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: 'Pending',
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: 'Completed',
};

export const IMAGING_REQUEST_COLORS = {
  [IMAGING_REQUEST_STATUS_TYPES.PENDING]: '#aaf',
  [IMAGING_REQUEST_STATUS_TYPES.COMPLETED]: '#afa',
  unknown: '#333',
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

const headerSortingStyle = { backgroundColor: '#c8e6c9' };

export const dateFormat = 'L'; // 06/09/2014, swap mm and dd based on locale
export const dateTimeFormat = 'YYYY-MM-DD hh:mm A';

export const dateFormatText = 'Do MMM YYYY';

export const momentSimpleCalender = {
  sameDay: '[Today]',
  nextDay: '[Tomorrow]',
  nextWeek: null,
  lastDay: '[Yesterday]',
  lastWeek: null,
  sameElse: null,
};

export const timeFormat = 'hh:mm a';

export const pageSizes = {
  patients: 10,
  pregnancies: 5,
  surveyResponses: 5,
  medicationRequests: 10,
  appointments: 10,
  patientLabRequests: 5,
};

// Generate time picker select options
export const timeSelectOptions = {
  hours: [],
  minutes: [],
};

const startOfDay = moment().startOf('day');
for (let i = 0; i <= 23; i += 1) {
  timeSelectOptions.hours.push({
    value: i,
    label: startOfDay.add(i > 0 ? 1 : 0, 'hours').format('hh A'),
  });
}
for (let i = 0; i <= 59; i += 1) {
  timeSelectOptions.minutes.push({
    value: i,
    label: padStart(i, 2, '0'),
  });
}

export const getDifferenceDate = (today, target) => {
  const difference = moment.duration(moment(today).diff(moment(target)));
  return difference.humanize();
};

export const encounterStatuses = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
  CHECKED_IN: 'CheckedIn',
  CHECKED_OUT: 'CheckedOut',
};

export const medicationStatuses = {
  COMPLETED: 'Completed',
  FULFILLED: 'Fulfilled',
  REQUESTED: 'Requested',
};

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

export const noteTypes = [
  { value: NOTE_TYPES.TREATMENT_PLAN, label: 'Treatment plan' },
  { value: 'medical', label: 'Medical' },
  { value: 'surgical', label: 'Surgical' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'dietary', label: 'Dietary' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'social', label: 'Social welfare' },
  { value: 'discharge', label: 'Discharge planning' },
  { value: NOTE_TYPES.OTHER, label: 'Other' },
  { value: NOTE_TYPES.SYSTEM, label: 'System', hideFromDropdown: true },
];

export const encounterOptions = [
  { value: ENCOUNTER_TYPES.ADMISSION, label: 'Hospital admission', image: medicationIcon },
  { value: ENCOUNTER_TYPES.CLINIC, label: 'Clinic', image: administrationIcon },
  { value: ENCOUNTER_TYPES.IMAGING, label: 'Imaging', image: radiologyIcon },
  { value: ENCOUNTER_TYPES.EMERGENCY, label: 'Emergency short stay', image: scheduleIcon },
  {
    value: ENCOUNTER_TYPES.OBSERVATION,
    label: 'Active ED patient',
    image: patientIcon,
    triageFlowOnly: true,
  },
  {
    value: ENCOUNTER_TYPES.TRIAGE,
    label: 'Triaged patient',
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
];

export const ENCOUNTER_OPTIONS_BY_VALUE = createValueIndex(encounterOptions);

export const TRIAGE_COLORS_BY_LEVEL = {
  1: Colors.alert,
  2: Colors.secondary,
  3: Colors.safe,
};

export const triagePriorities = [
  { value: '1', label: 'Emergency', color: TRIAGE_COLORS_BY_LEVEL[1] },
  { value: '2', label: 'Priority', color: TRIAGE_COLORS_BY_LEVEL[2] },
  { value: '3', label: 'Non-urgent', color: TRIAGE_COLORS_BY_LEVEL[3] },
];

export const immunisationStatusList = [
  { value: 'On time', label: 'On time', color: TRIAGE_COLORS_BY_LEVEL[3] },
  { value: 'Late', label: 'Late', color: TRIAGE_COLORS_BY_LEVEL[2] },
  { value: 'Missing', label: 'Missing', color: TRIAGE_COLORS_BY_LEVEL[1] },
];

export const operativePlanStatuses = {
  PLANNED: 'planned',
  DROPPED: 'dropped',
  COMPLETED: 'completed',
};

export const operativePlanStatusList = Object.values(operativePlanStatuses).map(status => ({
  value: status,
  label: capitalize(status),
}));

export const appointmentStatusList = [
  { value: 'attended', label: 'Attended' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'missed', label: 'Missed' },
];

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

export const maritalStatusOptions = [
  { value: 'Defacto', label: 'De facto' },
  { value: 'Married', label: 'Married' },
  { value: 'Single', label: 'Single' },
  { value: 'Widow', label: 'Widow' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Unknown', label: 'Unknown' },
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
  HOST: 'host',
};

export const VACCINE_STATUS = {
  UNKNOWN: 'UNKNOWN',
  GIVEN: 'GIVEN',
  NOT_GIVEN: 'NOT_GIVEN',
  SCHEDULED: 'SCHEDULED',
  MISSED: 'MISSED',
  DUE: 'DUE',
  UPCOMING: 'UPCOMING',
  OVERDUE: 'OVERDUE',
};

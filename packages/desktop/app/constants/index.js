import moment from 'moment';
import { padStart, capitalize } from 'lodash';

import { createValueIndex } from 'shared/utils/valueIndex';
import { ENCOUNTER_TYPES, IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants';
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
  { value: 'treatmentPlan', label: 'Treatment plan' },
  { value: 'medical', label: 'Medical' },
  { value: 'surgical', label: 'Surgical' },
  { value: 'nursing', label: 'Nursing' },
  { value: 'dietary', label: 'Dietary' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'social', label: 'Social welfare' },
  { value: 'discharge', label: 'Discharge planning' },
  { value: 'other', label: 'Other' },
  { value: 'system', label: 'System', hideFromDropdown: true },
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
  { value: ENCOUNTER_TYPES.CLINIC, label: 'Diabetes Hub', image: administrationIcon },
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

export const sexOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const SEX_VALUE_INDEX = createValueIndex(sexOptions);

export const lookupOptions = [
  { value: 'billing_categories', label: 'Billing Categories' },
  { value: 'clinic_list', label: 'Clinic Locations' },
  { value: 'diagnosis_list', label: 'Diagnoses' },
  { value: 'patient_status_list', label: 'Patient Status List' },
  { value: 'physician_list', label: 'Physicians' },
  { value: 'procedure_list', label: 'Procedures' },
  { value: 'procedure_locations', label: 'Procedures Locations' },
  { value: 'radiologists', label: 'Radiologists' },
  { value: 'sex', label: 'Sex' },
  { value: 'unit_types', label: 'Unit Types' },
  { value: 'encounter_location_list', label: 'Encounter Locations' },
  { value: 'encounter_types', label: 'Encounter Types' },
  { value: 'female', label: 'Female' },
];

export const pregnancyOutcomes = [
  { value: '', label: 'N/A' },
  { value: 'liveBirth', label: 'Live Birth' },
  { value: 'stillBirth', label: 'Still Birth' },
  { value: 'fetalDeath', label: 'Fetal Death' },
];

export const outPatientColumns = [
  {
    key: 'displayId',
    title: 'Id',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'firstName',
    title: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    title: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    title: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    title: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    CellComponent: () => {},
  },
];

export const patientContactColumns = [
  {
    key: 'name',
    title: 'Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'phone',
    title: 'Phone',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'email',
    title: 'Email',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'relationship',
    title: 'Relationship',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
  },
];

export const patientMedicationColumns = [
  {
    key: 'drug.name',
    title: 'Medicine',
    headerStyle,
    style: {
      ...columnStyleSlim,
      justifyContent: 'center',
      whiteSpace: 'normal',
    },
    minWidth: 100,
  },
  {
    key: 'qtyMorning',
    title: 'Morning',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyLunch',
    title: 'Lunch',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyEvening',
    title: 'Evening',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyNight',
    title: 'Night',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'notes',
    title: 'Notes',
    headerStyle,
    style: columnStyleSlim,
    minWidth: 100,
  },
];

export const pregnancyColumns = [
  {
    key: 'label',
    title: 'Pregnancies',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'conceiveDate',
    title: 'Conception Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'deliveryDate',
    title: 'Delivery Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'outcomeLabel',
    title: 'Outcome',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    accessor: row => ({ id: row.id, admitted: row.admitted }),
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 350,
    CellComponent: null,
  },
];

export const encountersColumns = [
  {
    key: 'startDate',
    title: 'Start Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'endDate',
    title: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'diagnosis',
    title: 'Diagnosis',
    headerStyle,
    style: columnStyle,
  },
  {
    key: 'examiner',
    title: 'Provider',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    title: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'encounterType',
    title: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    accessor: row => ({ id: row.id, admitted: row.admitted }),
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 100,
    CellComponent: null,
  },
];

export const vitalsColumns = [
  // TODO Add back in after the vitals taker is recorded
  // {
  //   key: 'taken',
  //   title: 'Taken By',
  //   headerStyle,
  //   style: columnStyle,
  //   minWidth: 100
  // },
  {
    key: 'dateRecorded',
    accessor: row => moment(row.dateRecorded).format(dateTimeFormat),
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
  },
  {
    key: 'temperature',
    title: 'Temperature',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'weight',
    title: 'Weight',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'height',
    title: 'Height',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sbp',
    title: 'SBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'dbp',
    title: 'DBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'heartRate',
    title: 'Heart Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'respiratoryRate',
    title: 'Respiratory Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 200,
    CellComponent: null,
  },
];

export const notesColumns = [
  {
    key: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'authoredBy',
    title: 'Authored By',
    headerStyle,
    style: columnStyle,
    // TODO: this prevents a crash, but is definitely still broken
    accessor: row => `${row.authoredBy}`,
    minWidth: 100,
  },
  {
    key: 'content',
    title: 'Note',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
  },
];

export const proceduresColumns = [
  {
    key: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'description',
    title: 'Procedure',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
  },
];

export const proceduresMedicationColumns = [
  {
    key: 'medication',
    title: 'Item',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'quantity',
    title: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
  },
];

export const programsPatientsColumns = [
  {
    key: 'displayId',
    title: 'Patient ID',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'firstName',
    title: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    title: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    title: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
    filterable: false,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    title: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    filterable: false,
  },
];

export const medicationColumns = [
  {
    key: 'patient',
    title: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'prescriber',
    title: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'drug',
    title: 'Medication',
    headerStyle,
    style: {
      ...columnStyle,
      whiteSpace: 'normal',
    },
    minWidth: 300,
  },
  {
    key: 'quantity',
    title: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [
      {
        title: 'Morning',
        key: 'qtyMorning',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Lunch',
        key: 'qtyLunch',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Evening',
        key: 'qtyEvening',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Night',
        key: 'qtyNight',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
    ],
  },
  {
    key: 'status',
    title: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const medicationCompletedColumns = [
  {
    key: 'prescriptionDate',
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'end-date',
    accessor: row => (moment(row.endDate).isValid() ? moment(row.endDate).format(dateFormat) : '-'),
    title: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'patient',
    title: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'prescriber',
    title: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'drug',
    title: 'Medication',
    headerStyle,
    style: columnStyle,
    minWidth: 300,
  },
  {
    key: 'quantity',
    title: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [
      {
        title: 'Morning',
        key: 'qtyMorning',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Lunch',
        key: 'qtyLunch',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Evening',
        key: 'qtyEvening',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        title: 'Night',
        key: 'qtyNight',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
    ],
  },
  {
    key: 'status',
    title: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const invoiceColumns = [
  {
    dataField: 'date',
    text: 'Date',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'patient',
    text: 'Patient',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'prescriber',
    text: 'Prescriber',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'medication',
    text: 'Medication',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'quantity',
    text: 'Quantity',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'status',
    text: 'Status',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'action',
    text: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
];

export const invoiceLineItemColumns = [
  {
    dataField: 'description',
    text: 'Description',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'actualCharge',
    text: 'Actual Charges',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'discount',
    text: 'Discount',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'national',
    text: 'National Insurance',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'hmo',
    text: 'HMO/COM',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'excess',
    text: 'Excess',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'action',
    text: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
];

export const invoicePaymentColumns = [
  {
    dataField: 'date',
    text: 'Date',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'amount',
    text: 'Amount',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'type',
    text: 'Type',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'notes',
    text: 'Notes',
    sort: true,
    headerSortingStyle,
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'action',
    text: 'Action',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
];

export const labsColumns = [
  {
    dataField: 'date',
    text: 'Date Requested',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'patient',
    text: 'Patient',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'requestedBy',
    text: 'Requested By',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'type',
    text: 'Lab Type',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'note',
    text: 'Notes',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
  {
    dataField: 'action',
    text: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
  },
];

export const appointments = [
  {
    key: 0,
    title: 'Board meeting',
    start: new Date(2018, 4, 11, 9, 0, 0),
    end: new Date(2018, 4, 13, 13, 0, 0),
    resourceId: 1,
  },
  {
    key: 1,
    title: 'MS training',
    start: new Date(2018, 4, 29, 14, 0, 0),
    end: new Date(2018, 4, 29, 16, 30, 0),
    resourceId: 2,
  },
  {
    key: 2,
    title: 'Team lead meeting',
    start: new Date(2018, 4, 29, 8, 30, 0),
    end: new Date(2018, 4, 29, 12, 30, 0),
    resourceId: 3,
  },
  {
    key: 11,
    title: 'Birthday Party',
    start: new Date(2018, 4, 30, 7, 0, 0),
    end: new Date(2018, 4, 30, 10, 30, 0),
    resourceId: 4,
  },
];

export const surveyResponsesColumns = [
  {
    key: 'date',
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
];

export const appointmentsColumns = [
  {
    key: 'startDate',
    accessor: row => moment(row.startDate).format(dateFormat),
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'patientsName',
    title: 'Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    sortable: false,
  },
  {
    key: 'appointmentType',
    accessor: row => capitalize(row.appointmentType),
    title: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'location',
    title: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'provider',
    title: 'With',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'status',
    accessor: row => capitalize(row.status),
    title: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
    sortable: false,
  },
];

export const patientAppointmentsColumns = [
  {
    key: 'startDate',
    accessor: row => moment(row.startDate).format(dateFormat),
    title: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'appointmentType',
    accessor: row => capitalize(row.appointmentType),
    title: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'location',
    title: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'provider',
    title: 'With',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'status',
    accessor: row => capitalize(row.status),
    title: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'actions',
    title: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    CellComponent: null,
    sortable: false,
  },
];

export const imagingRequestsColumns = [
  {
    key: 'patientName',
    title: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'typeName',
    title: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    title: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'requestedBy',
    title: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    title: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'detail',
    title: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const patientImagingRequestsColumns = [
  {
    key: 'typeName',
    accessor: ({ type }) => type.name,
    title: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    title: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'requestedBy',
    accessor: ({ requestedBy }) => requestedBy.name,
    title: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    title: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'detail',
    title: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'status',
    accessor: ({ status }) => capitalize(status),
    title: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const REPORT_TYPES = {
  PIE_CHART: 'pie-chart',
  BAR_CHART: 'bar-chart',
  LINE_CHART: 'line-graph',
  RAW: 'raw',
  TABLE: 'table',
};

import moment from 'moment';
import { defaults, padStart, capitalize } from 'lodash';
import {
  patientIcon,
  scheduleIcon,
  medicationIcon,
  labsIcon,
  administrationIcon,
  programsIcon,
  radiologyIcon,
} from './images';

import { availableReports } from '../containers/Reports/dummyReports';

export const REMEMBER_EMAIL_KEY = 'remember-email';

export const DISPLAY_ID_PLACEHOLDER = '-TMP-';

export const PREGNANCY_PROGRAM_ID = 'program-pregnancy';

export const REALM_DATE_FORMAT = 'YYYY-MM-DD@HH:MM:SS';

export const DB_OBJECTS_MAX_DEPTH = {
  PATIENT_MAIN: 10,
  VISIT_MAIN: 7,
};

export const Colors = {
  searchTintColor: '#d2dae3',
  white: '#ffffff',
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

export const IMAGING_REQUEST_STATUSES = {
  PENDING: 'pending',
  COMPLETED: 'completed',
};

export const submenuIcons = {
  calendar: 'fa fa-calendar',
  new: 'fa fa-plus',
  search: 'fa fa-search',
  table: 'fa fa-th-list',
  users: 'fa fa-users',
  permissions: 'fa fa-lock',
  cog: 'fa fa-cog',
  report: 'fa fa-chevron-circle-right',
  action: 'fa fa-chevron-circle-right',
};

export const columnStyle = {
  backgroundColor: Colors.white,
  height: '60px',
  color: '#2f4358',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const columnStyleSlim = {
  backgroundColor: Colors.white,
  height: '40px',
  color: '#2f4358',
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
    label: startOfDay.add((i > 0 ? 1 : 0), 'hours').format('hh A'),
  });
}
for (let i = 0; i <= 59; i += 1) {
  timeSelectOptions.minutes.push({
    value: i,
    label: padStart(i, 2, '0'),
  });
}

export const sidebarInfo = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'Patient Listing',
        path: '/patients',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Admitted Patients',
        path: '/patients/admitted',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Outpatients',
        path: '/patients/outpatient',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Patient',
        path: '/patients/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'scheduling',
    label: 'Scheduling',
    path: '/appointments',
    icon: scheduleIcon,
    ability: { subject: 'appointment' },
    children: [
      {
        label: 'Appointments This Week',
        path: '/appointments/week',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: "Today's Appointments",
        path: '/appointments/today',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Search Appointments',
        path: '/appointments/search',
        icon: submenuIcons.search,
        ability: { action: 'read' },
      },
      {
        label: 'Appointments Calendar',
        path: '/appointments/calendar',
        icon: submenuIcons.calendar,
        ability: { action: 'read' },
      },
      {
        label: 'Add Appointment',
        path: '/appointments/appointment/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
      {
        label: 'Theater Schedule',
        path: '/appointments/theater',
        icon: submenuIcons.calendar,
        ability: { action: 'read' },
      },
      {
        label: 'Schedule Surgery',
        path: '/appointments/surgery/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'medication',
    label: 'Medication',
    path: '/medication',
    icon: medicationIcon,
    ability: { subject: 'medication' },
    children: [
      {
        label: 'Requests',
        path: '/medication/requests',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/medication/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/medication/request',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
      {
        label: 'Dispense',
        path: '/medication/dispense',
        icon: submenuIcons.action,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'imaging',
    label: 'Imaging',
    path: '/imaging',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: 'Requests',
        path: '/imaging',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/imaging/request',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'labs',
    label: 'Labs',
    path: '/labs',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: 'Requests',
        path: '/labs',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/labs/completed',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'New Request',
        path: '/labs/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: administrationIcon,
    ability: { subject: 'user', action: 'read' },
    children: [
      {
        label: 'Settings',
        path: '/admin/settings',
        icon: submenuIcons.cog,
      },
      {
        label: 'Users',
        path: '/admin/users',
        icon: submenuIcons.users,
        ability: { action: 'read', subject: 'user' },
      },
      {
        label: 'Permissions',
        path: '/admin/permissions',
        icon: submenuIcons.permissions,
        ability: { action: 'read', subject: 'userRole' },
      },
      {
        label: 'New User',
        path: '/admin/users/edit/new',
        icon: submenuIcons.new,
        ability: { action: 'create', subject: 'user' },
      },
    ],
  },
  {
    key: 'programs',
    label: 'Programs',
    path: '/programs',
    icon: programsIcon,
    ability: { action: 'read', subject: 'program' },
    children: [],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: scheduleIcon,
    ability: { action: 'read', subject: 'report' },
    children: availableReports.map(report => ({
      label: report.name,
      path: `/reports/${report.id}`,
      icon: submenuIcons.report,
    })),
  },
];

export const getDifferenceDate = (today, target) => {
  const difference = moment.duration(moment(today).diff(moment(target)));
  return difference.humanize();
};

export const visitStatuses = {
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
  { value: 'australian-capital-territory', label: 'Australian Capital Territory', className: 'State-ACT' },
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
  { value: 'visit', label: 'Visit', className: 'State-NT' },
];

export const diagnosisCertainty = [
  { value: 'suspected', label: 'Suspected' },
  { value: 'confirmed', label: 'Confirmed' },
];

export const visitOptions = [
  { value: 'admission', label: 'Admission' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'followup', label: 'Followup' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'lab', label: 'Lab' },
  { value: 'pharmacy', label: 'Pharmacy' },
];

export const operativePlanStatusList = [
  { value: 'planned', label: 'Planned' },
  { value: 'dropped', label: 'Dropped' },
  { value: 'completed', label: 'Completed' },
];

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
];

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
  { value: 'visit_location_list', label: 'Visit Locations' },
  { value: 'visit_types', label: 'Visit Types' },
  { value: 'female', label: 'Female' },
];

export const pregnancyOutcomes = [
  { value: '', label: 'N/A' },
  { value: 'liveBirth', label: 'Live Birth' },
  { value: 'stillBirth', label: 'Still Birth' },
  { value: 'fetalDeath', label: 'Fetal Death' },
];

export const patientColumns = [
  {
    accessor: 'displayId',
    Header: 'Id',
    headerStyle,
    style: {
      ...columnStyle,
      justifyContent: 'left',
    },
    minWidth: 80,
    Cell: () => {},
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    id: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: () => {},
  },
];

export const admittedPatientsColumns = [
  {
    accessor: 'displayId',
    Header: 'Id',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    accessor: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    id: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'actiomns',
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: {},
  },
];

export const outPatientColumns = [
  {
    accessor: 'displayId',
    Header: 'Id',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    id: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: () => {},
  },
];

export const patientContactColumns = [
  {
    accessor: 'name',
    Header: 'Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'phone',
    Header: 'Phone',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'email',
    Header: 'Email',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'relationship',
    Header: 'Relationship',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
  },
];

export const patientMedicationColumns = [
  {
    accessor: 'drug.name',
    Header: 'Medicine',
    headerStyle,
    style: {
      ...columnStyleSlim,
      justifyContent: 'center',
      whiteSpace: 'normal',
    },
    minWidth: 100,
  }, {
    accessor: 'qtyMorning',
    Header: 'Morning',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  }, {
    accessor: 'qtyLunch',
    Header: 'Lunch',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  }, {
    accessor: 'qtyEvening',
    Header: 'Evening',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  }, {
    accessor: 'qtyNight',
    Header: 'Night',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  }, {
    accessor: 'notes',
    Header: 'Notes',
    headerStyle,
    style: columnStyleSlim,
    minWidth: 100,
  },
];

export const pregnancyColumns = [
  {
    accessor: 'label',
    Header: 'Pregnancies',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'conceiveDate',
    Header: 'Conception Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'deliveryDate',
    Header: 'Delivery Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'outcomeLabel',
    Header: 'Outcome',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 350,
    Cell: null,
  },
];

export const visitsColumns = [
  {
    accessor: 'startDate',
    Header: 'Start Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'endDate',
    Header: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'diagnosis',
    Header: 'Diagnosis',
    headerStyle,
    style: columnStyle,
  }, {
    accessor: 'examiner',
    Header: 'Provider',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'visitType',
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 100,
    Cell: null,
  },
];

export const vitalsColumns = [
  // TODO Add back in after the vitals taker is recorded
  // {
  //   accessor: 'taken',
  //   Header: 'Taken By',
  //   headerStyle,
  //   style: columnStyle,
  //   minWidth: 100
  // },
  {
    id: 'dateRecorded',
    accessor: row => moment(row.dateRecorded).format(dateTimeFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
  }, {
    accessor: 'temperature',
    Header: 'Temperature',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'weight',
    Header: 'Weight',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'height',
    Header: 'Height',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'sbp',
    Header: 'SBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'dbp',
    Header: 'DBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'heartRate',
    Header: 'Heart Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'respiratoryRate',
    Header: 'Respiratory Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 200,
    Cell: null,
  },
];

export const notesColumns = [
  {
    id: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'authoredBy',
    Header: 'Authored By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'content',
    Header: 'Note',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
  },
];

export const proceduresColumns = [
  {
    id: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'description',
    Header: 'Procedure',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
  },
];

export const proceduresMedicationColumns = [
  {
    accessor: 'medication',
    Header: 'Item',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
  },
];

export const programsPatientsColumns = [
  {
    accessor: 'displayId',
    Header: 'Patient ID',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
    filterable: false,
  }, {
    id: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    filterable: false,
  }, {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 350,
    Cell: null,
    filterable: false,
  },
];

export const medicationColumns = [
  {
    accessor: 'prescriptionDate',
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'patient',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'prescriber',
    Header: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'drug',
    Header: 'Medication',
    headerStyle,
    style: {
      ...columnStyle,
      whiteSpace: 'normal',
    },
    minWidth: 300,
  }, {
    accessor: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [{
      Header: 'Morning',
      accessor: 'qtyMorning',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Lunch',
      accessor: 'qtyLunch',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Evening',
      accessor: 'qtyEvening',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Night',
      accessor: 'qtyNight',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }],
  }, {
    accessor: 'status',
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
    Cell: null,
    filterable: false,
  },
];

export const medicationCompletedColumns = [
  {
    accessor: 'prescriptionDate',
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'end-date',
    accessor: row => (moment(row.endDate).isValid() ? moment(row.endDate).format(dateFormat) : '-'),
    Header: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'patient',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'prescriber',
    Header: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'drug',
    Header: 'Medication',
    headerStyle,
    style: columnStyle,
    minWidth: 300,
  }, {
    accessor: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [{
      Header: 'Morning',
      accessor: 'qtyMorning',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Lunch',
      accessor: 'qtyLunch',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Evening',
      accessor: 'qtyEvening',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }, {
      Header: 'Night',
      accessor: 'qtyNight',
      headerStyle,
      style: columnStyle,
      maxWidth: 80,
    }],
  }, {
    accessor: 'status',
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const invoiceColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'prescriber',
  text: 'Prescriber',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'medication',
  text: 'Medication',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'quantity',
  text: 'Quantity',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'status',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}];

export const invoiceLineItemColumns = [{
  dataField: 'description',
  text: 'Description',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'actualCharge',
  text: 'Actual Charges',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'discount',
  text: 'Discount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'national',
  text: 'National Insurance',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'hmo',
  text: 'HMO/COM',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'excess',
  text: 'Excess',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}];

export const invoicePaymentColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'amount',
  text: 'Amount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'type',
  text: 'Type',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'notes',
  text: 'Notes',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'action',
  text: 'Action',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}];

export const labsColumns = [{
  dataField: 'date',
  text: 'Date Requested',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'requestedBy',
  text: 'Requested By',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'type',
  text: 'Lab Type',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'note',
  text: 'Notes',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
}];

export const appointments = [
  {
    id: 0,
    title: 'Board meeting',
    start: new Date(2018, 4, 11, 9, 0, 0),
    end: new Date(2018, 4, 13, 13, 0, 0),
    resourceId: 1,
  },
  {
    id: 1,
    title: 'MS training',
    start: new Date(2018, 4, 29, 14, 0, 0),
    end: new Date(2018, 4, 29, 16, 30, 0),
    resourceId: 2,
  },
  {
    id: 2,
    title: 'Team lead meeting',
    start: new Date(2018, 4, 29, 8, 30, 0),
    end: new Date(2018, 4, 29, 12, 30, 0),
    resourceId: 3,
  },
  {
    id: 11,
    title: 'Birthday Party',
    start: new Date(2018, 4, 30, 7, 0, 0),
    end: new Date(2018, 4, 30, 10, 30, 0),
    resourceId: 4,
  },
];

export const surveyResponsesColumns = [{
  accessor: 'date',
  Header: 'Date',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
}, {
  accessor: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}];

export const appointmentsColumns = [{
  id: 'startDate',
  accessor: row => moment(row.startDate).format(dateFormat),
  Header: 'Date',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
}, {
  accessor: 'patientsName',
  Header: 'Name',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
  sortable: false,
}, {
  id: 'appointmentType',
  accessor: row => capitalize(row.appointmentType),
  Header: 'Type',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  accessor: 'location',
  Header: 'Location',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
}, {
  accessor: 'provider',
  Header: 'With',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  id: 'status',
  accessor: row => capitalize(row.status),
  Header: 'Status',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  id: 'actions',
  Header: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
  style: columnStyle,
  minWidth: 250,
  Cell: null,
  sortable: false,
}];

export const patientAppointmentsColumns = [{
  id: 'startDate',
  accessor: row => moment(row.startDate).format(dateFormat),
  Header: 'Date',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
}, {
  id: 'appointmentType',
  accessor: row => capitalize(row.appointmentType),
  Header: 'Type',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  accessor: 'location',
  Header: 'Location',
  headerStyle,
  style: columnStyle,
  minWidth: 100,
}, {
  accessor: 'provider',
  Header: 'With',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  id: 'status',
  accessor: row => capitalize(row.status),
  Header: 'Status',
  headerStyle,
  style: columnStyle,
  minWidth: 80,
}, {
  id: 'actions',
  Header: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
  },
  style: columnStyle,
  minWidth: 250,
  Cell: null,
  sortable: false,
}];

export const imagingRequestsColumns = [
  {
    accessor: 'patientName',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'typeName',
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    Header: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  }, {
    accessor: 'requestedBy',
    Header: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'detail',
    Header: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const patientImagingRequestsColumns = [
  {
    id: 'typeName',
    accessor: ({ type }) => type.name,
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    Header: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  }, {
    id: 'requestedBy',
    accessor: ({ requestedBy }) => requestedBy.name,
    Header: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    accessor: 'detail',
    Header: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'status',
    accessor: ({ status }) => capitalize(status),
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
  },
];

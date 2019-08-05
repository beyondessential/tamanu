import moment from 'moment';
import { padStart, capitalize } from 'lodash';

export const MUI_SPACING_UNIT = 8;

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
  { value: 'visit', label: 'Visit', className: 'State-NT' },
];

export const diagnosisCertainty = [
  { value: 'suspected', label: 'Suspected' },
  { value: 'confirmed', label: 'Confirmed' },
];

export const visitOptions = [
  { value: 'admission', label: 'Admission' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'imaging', label: 'Imaging' },
  { value: 'lab', label: 'Lab' },
  { value: 'emergency', label: 'Emergency' },
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

export const sexOptions = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];

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
    key: 'displayId',
    Header: 'Id',
    headerStyle,
    style: {
      ...columnStyle,
      justifyContent: 'left',
    },
    minWidth: 80,
    Cell: () => {},
  },
  {
    key: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: () => {},
  },
];

export const admittedPatientsColumns = [
  {
    key: 'displayId',
    Header: 'Id',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const outPatientColumns = [
  {
    key: 'displayId',
    Header: 'Id',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 250,
    Cell: () => {},
  },
];

export const patientContactColumns = [
  {
    key: 'name',
    Header: 'Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'phone',
    Header: 'Phone',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'email',
    Header: 'Email',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'relationship',
    Header: 'Relationship',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
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
    key: 'drug.name',
    Header: 'Medicine',
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
    Header: 'Morning',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyLunch',
    Header: 'Lunch',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyEvening',
    Header: 'Evening',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'qtyNight',
    Header: 'Night',
    headerStyle,
    style: columnStyleSlim,
    maxWidth: 150,
  },
  {
    key: 'notes',
    Header: 'Notes',
    headerStyle,
    style: columnStyleSlim,
    minWidth: 100,
  },
];

export const pregnancyColumns = [
  {
    key: 'label',
    Header: 'Pregnancies',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'conceiveDate',
    Header: 'Conception Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'deliveryDate',
    Header: 'Delivery Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'outcomeLabel',
    Header: 'Outcome',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    key: 'actions',
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
    key: 'startDate',
    Header: 'Start Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'endDate',
    Header: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'diagnosis',
    Header: 'Diagnosis',
    headerStyle,
    style: columnStyle,
  },
  {
    key: 'examiner',
    Header: 'Provider',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'visitType',
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    accessor: row => ({ _id: row._id, admitted: row.admitted }),
    key: 'actions',
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
  //   key: 'taken',
  //   Header: 'Taken By',
  //   headerStyle,
  //   style: columnStyle,
  //   minWidth: 100
  // },
  {
    key: 'dateRecorded',
    accessor: row => moment(row.dateRecorded).format(dateTimeFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
  },
  {
    key: 'temperature',
    Header: 'Temperature',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'weight',
    Header: 'Weight',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'height',
    Header: 'Height',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sbp',
    Header: 'SBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'dbp',
    Header: 'DBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'heartRate',
    Header: 'Heart Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'respiratoryRate',
    Header: 'Respiratory Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'actions',
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
    key: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'authoredBy',
    Header: 'Authored By',
    headerStyle,
    style: columnStyle,
    // TODO: this prevents a crash, but is definitely still broken
    accessor: row => '' + row.authoredBy,
    minWidth: 100,
  },
  {
    key: 'content',
    Header: 'Note',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
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
    key: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'description',
    Header: 'Procedure',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
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
    key: 'medication',
    Header: 'Item',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
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
    key: 'displayId',
    Header: 'Patient ID',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
    filterable: false,
  },
  {
    key: 'dateOfBirth',
    accessor: row => moment(row.dateOfBirth).format(dateFormat),
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    filterable: false,
  },
];

export const medicationColumns = [
  {
    key: 'patient',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'prescriber',
    Header: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'drug',
    Header: 'Medication',
    headerStyle,
    style: {
      ...columnStyle,
      whiteSpace: 'normal',
    },
    minWidth: 300,
  },
  {
    key: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [
      {
        Header: 'Morning',
        key: 'qtyMorning',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Lunch',
        key: 'qtyLunch',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Evening',
        key: 'qtyEvening',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Night',
        key: 'qtyNight',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
    ],
  },
  {
    key: 'status',
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const medicationCompletedColumns = [
  {
    key: 'prescriptionDate',
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'end-date',
    accessor: row => (moment(row.endDate).isValid() ? moment(row.endDate).format(dateFormat) : '-'),
    Header: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'patient',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'prescriber',
    Header: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'drug',
    Header: 'Medication',
    headerStyle,
    style: columnStyle,
    minWidth: 300,
  },
  {
    key: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    columns: [
      {
        Header: 'Morning',
        key: 'qtyMorning',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Lunch',
        key: 'qtyLunch',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Evening',
        key: 'qtyEvening',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
      {
        Header: 'Night',
        key: 'qtyNight',
        headerStyle,
        style: columnStyle,
        maxWidth: 80,
      },
    ],
  },
  {
    key: 'status',
    Header: 'Status',
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
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
];

export const appointmentsColumns = [
  {
    key: 'startDate',
    accessor: row => moment(row.startDate).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'patientsName',
    Header: 'Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    sortable: false,
  },
  {
    key: 'appointmentType',
    accessor: row => capitalize(row.appointmentType),
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'provider',
    Header: 'With',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'status',
    accessor: row => capitalize(row.status),
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
    sortable: false,
  },
];

export const patientAppointmentsColumns = [
  {
    key: 'startDate',
    accessor: row => moment(row.startDate).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'appointmentType',
    accessor: row => capitalize(row.appointmentType),
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'provider',
    Header: 'With',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'status',
    accessor: row => capitalize(row.status),
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
  },
  {
    key: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null,
    sortable: false,
  },
];

export const imagingRequestsColumns = [
  {
    key: 'patientName',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'typeName',
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    Header: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'requestedBy',
    Header: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'detail',
    Header: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

export const patientImagingRequestsColumns = [
  {
    key: 'typeName',
    accessor: ({ type }) => type.name,
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'requestedDate',
    accessor: row => moment(row.requestedDate).format(dateTimeFormat),
    Header: 'Date & Time of Request',
    headerStyle,
    style: columnStyle,
    minWidth: 150,
  },
  {
    key: 'requestedBy',
    accessor: ({ requestedBy }) => requestedBy.name,
    Header: 'Requested By',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'detail',
    Header: 'Detail',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
  {
    key: 'status',
    accessor: ({ status }) => capitalize(status),
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
  },
];

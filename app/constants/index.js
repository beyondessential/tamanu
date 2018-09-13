import React from 'react';
import moment from 'moment';
import dbService from '../services/database';
import { patientIcon, scheduleIcon, medicationIcon, labsIcon, administrationIcon, programsIcon } from './images';

export const Colors = {
  searchTintColor: '#d2dae3',
  white: '#ffffff'
};

const columnStyle = {
  backgroundColor: Colors.white,
  height: '60px',
  color: '#2f4358',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const headerStyle = {
  backgroundColor: Colors.searchTintColor,
};

const headerSortingStyle = { backgroundColor: '#c8e6c9' };

export const dateFormat = 'YYYY-MM-DD';

export const timeFormat = 'hh:mm a';

export const pageSizes = {
  patients: 10,
  pregnancies: 5,
  surveyResponses: 5,
  medicationRequests: 10,
};

export const sidebarInfo = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    children: [
      {
        label: 'Patient Listing',
        path: '/patients',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Admitted Patients',
        path: '/patients/admitted',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Outpatient',
        path: '/patients/outpatient',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Patient',
        path: '/patients/edit/new',
        icon: 'fa fa-plus'
      },
      {
        label: 'Reports',
        path: '/patients/reports',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
  {
    key: 'scheduling',
    label: 'Scheduling',
    path: '/appointments',
    icon: scheduleIcon,
    children: [
      {
        label: 'Appointments This Week',
        path: '/appointments',
        icon: 'fa fa-chevron-right'
      },
      {
        label: "Today's Appointments",
        path: '/appointments/today',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Search Appointments',
        path: '/appointments/search',
        icon: 'fa fa-search'
      },
      {
        label: 'Appointments Calendar',
        path: '/appointments/calendar',
        icon: 'fa fa-calendar'
      },
      {
        label: 'Add Appointment',
        path: '/appointments/edit/new',
        icon: 'fa fa-plus'
      },
      {
        label: 'Theater Schedule',
        path: '/appointments/theater',
        icon: 'fa fa-calendar'
      },
      {
        label: 'Schedule Surgery',
        path: '/appointments/edit/newsurgery',
        icon: 'fa fa-plus'
      }
    ]
  },
  {
    key: 'medication',
    label: 'Medication',
    path: '/medication',
    icon: medicationIcon,
    children: [
      {
        label: 'Requests',
        path: '/medication/requests',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Completed',
        path: '/medication/completed',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Request',
        path: '/medication/request',
        icon: 'fa fa-plus'
      },
      {
        label: 'Dispense',
        path: '/medication/edit/dispense',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Return Medication',
        path: '/medication/return/new',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
  {
    key: 'labs',
    label: 'Labs',
    path: '/labs',
    icon: labsIcon,
    children: [
      {
        label: 'Requests',
        path: '/labs',
        icon: 'fa fa-chevron-right'
      },
      // {
      //   label: 'Completed',
      //   path: '/labs/completed',
      //   icon: 'fa fa-chevron-right'
      // },
      // {
      //   label: 'New Request',
      //   path: '/labs/edit/new',
      //   icon: 'fa fa-plus'
      // }
    ]
  },
  {
    key: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: administrationIcon,
    children: [
      {
        label: 'Address Fields',
        path: '/admin/address',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Shortcodes',
        path: '/admin/textreplace',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Print Header',
        path: '/admin/print-header',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Users',
        path: '/admin/users',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New User',
        path: '/admin/users/edit/new',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'User Roles',
        path: '/admin/roles',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
  {
    key: 'programs',
    label: 'Programs',
    path: '/programs',
    icon: programsIcon,
    hidden: true,
    children: []
  },
];

function padDigits(number, digits) {
  return Array(Math.max((digits - String(number).length) + 1, 0)).join(0) + number;
}

export const getDisplayId = (item) => {
  return new Promise(async (resolve, reject) => {
    const { mainDB } = dbService;
    try {
      const doc = await mainDB.get('patient_id_seq');
      doc.value += 1;
      const renderedValue = padDigits(doc.value, 5);
      // Update value
      await mainDB.put(doc);
      return resolve(item + renderedValue);
    } catch (err) {
      reject(err);
    };
  });
};

export const getDifferenceDate = (today, target) => {
  const difference = moment.duration(moment(today, 'DD/MM/YYYY HH:mm:ss').diff(moment(target, 'DD/MM/YYYY HH:mm:ss')));
  return difference.humanize();
};

export const visitStatuses = {
  ADMITTED: 'Admitted',
  DISCHARGED: 'Discharged',
  CHECKED_IN: 'CheckedIn',
  CHECKED_OUT: 'CheckedOut',
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
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 80
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 80
  }, {
    accessor: 'birthday',
    Header: 'DOB',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'patientStatus',
    Header: 'Status',
    headerStyle: {
      backgroundColor: Colors.searchTintColor,
    },
    style: columnStyle,
    minWidth: 80
  }, {
    accessor: 'actiomns',
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 250,
    Cell: {}
  }
];

export const pregnancyColumns = [
  {
    accessor: 'label',
    Header: 'Pregnancies',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'conceiveDate',
    Header: 'Conception Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'deliveryDate',
    Header: 'Delivery Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'outcomeLabel',
    Header: 'Outcome',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: row => {
      return { _id: row._id, admitted: row.admitted };
    },
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 350,
    Cell: null
  }
];

export const visitsColumns = [
  {
    accessor: 'startDate',
    Header: 'Start Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'endDate',
    Header: 'End Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'diagnosis',
    Header: 'Diagnosis',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'examiner',
    Header: 'Provider',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'location',
    Header: 'Location',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'visitType',
    Header: 'Type',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: row => {
      return { _id: row._id, admitted: row.admitted };
    },
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 350,
    Cell: null
  }
];

export const vitalsColumns = [
  {
    accessor: 'taken',
    Header: 'Taken By',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    id: "dateRecorded",
    accessor: row => moment(row.dateRecorded).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'temperature',
    Header: 'Temperature',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'weight',
    Header: 'Weight',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'height',
    Header: 'Height',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'sbp',
    Header: 'SBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'dbp',
    Header: 'DBP',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'heartRate',
    Header: 'Heart Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'respiratoryRate',
    Header: 'Respiratory Rate',
    headerStyle,
    style: columnStyle,
    minWidth: 250
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null
  }
];

export const notesColumns = [
  {
    id: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'authoredBy',
    Header: 'Authored By',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'content',
    Header: 'Note',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null
  }
];

export const proceduresColumns = [
  {
    id: 'date',
    accessor: row => moment(row.date).format(dateFormat),
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'description',
    Header: 'Procedure',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null
  }
];

export const proceduresMedicationColumns = [
  {
    accessor: 'medication',
    Header: 'Item',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'quantity',
    Header: 'Quantity',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 250,
    Cell: null
  }
];

export const programsPatientsColumns = [
  {
    accessor: 'displayId',
    Header: 'Patient ID',
    headerStyle,
    style: columnStyle,
    minWidth: 80
  }, {
    accessor: 'firstName',
    Header: 'First Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'lastName',
    Header: 'Last Name',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'sex',
    Header: 'Sex',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
    filterable: false
  }, {
    accessor: 'birthday',
    Header: 'DOB',
    headerStyle,
    style: columnStyle,
    minWidth: 100,
    filterable: false
  }, {
    accessor: 'patientStatus',
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 80,
    filterable: false
  }, {
    accessor: row => {
      return { _id: row._id, admitted: row.admitted };
    },
    id: 'actions',
    Header: 'Actions',
    headerStyle: {
      backgroundColor: Colors.searchTintColor
    },
    style: columnStyle,
    minWidth: 350,
    Cell: null,
    filterable: false
  }
];

export const medicationColumns = [
  {
    accessor: 'prescriptionDate',
    Header: 'Date',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'patient',
    Header: 'Patient',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'prescriber',
    Header: 'Prescriber',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: 'drug',
    Header: 'Medication',
    headerStyle,
    style: columnStyle,
    minWidth: 300
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
    }]
  }, {
    accessor: 'status',
    Header: 'Status',
    headerStyle,
    style: columnStyle,
    minWidth: 100
  }, {
    accessor: row => {
      return { _id: row._id, admitted: row.admitted };
    },
    id: 'actions',
    Header: 'Actions',
    headerStyle,
    style: columnStyle,
    minWidth: 200,
    Cell: null,
    filterable: false
  }
];

export const invoiceColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'prescriber',
  text: 'Prescriber',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'medication',
  text: 'Medication',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'quantity',
  text: 'Quantity',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'status',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}];

export const invoiceLineItemColumns = [{
  dataField: 'description',
  text: 'Description',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  },
}, {
  dataField: 'actualCharge',
  text: 'Actual Charges',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'discount',
  text: 'Discount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'national',
  text: 'National Insurance',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'hmo',
  text: 'HMO/COM',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'excess',
  text: 'Excess',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}];

export const invoicePaymentColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  },
}, {
  dataField: 'amount',
  text: 'Amount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'type',
  text: 'Type',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'notes',
  text: 'Notes',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'action',
  text: 'Action',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}];

export const labsColumns = [{
  dataField: 'date',
  text: 'Date Requested',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'requestedBy',
  text: 'Requested By',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'type',
  text: 'Lab Type',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'note',
  text: 'Notes',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  }
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
  minWidth: 100
}, {
  accessor: 'actions',
  Header: 'Actions',
  headerStyle,
  style: columnStyle,
  minWidth: 80
}];

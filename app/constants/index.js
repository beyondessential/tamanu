import React from 'react';
import moment from 'moment';
import { patientDB } from '../utils/dbHelper';
import { patientIcon, scheduleIcon, medicationIcon, labsIcon, administrationIcon } from './images';

export const Colors = {
  searchTintColor: '#d2dae3',
  white: '#ffffff'
};

export const sidebarInfo = [
  {
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
  // {
  //   label: 'Imaging',
  //   path: '/imaging',
  //   icon: 'fa fa-camera-retro',
  //   children: [
  //     {
  //       label: 'Requests',
  //       path: '/imaging',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'Completed',
  //       path: '/imaging/completed',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'New Request',
  //       path: '/imaging/edit/new',
  //       icon: 'fa fa-plus'
  //     }
  //   ]
  // },
  {
    label: 'Medication',
    path: '/medication',
    icon: medicationIcon,
    children: [
      {
        label: 'Requests',
        path: '/medication',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Completed',
        path: '/medication/completed',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Request',
        path: '/medication/edit/new',
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
  // {
  //   label: 'Billing',
  //   path: '/invoices',
  //   icon: 'fa fa-credit-card',
  //   children: [
  //     {
  //       label: 'Invoices',
  //       path: '/invoices',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'New Invoice',
  //       path: '/invoices/edit/new',
  //       icon: 'fa fa-plus'
  //     },
  //     {
  //       label: 'Prices',
  //       path: '/invoices/pricing',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'Price Profiles',
  //       path: '/invoices/pricing/profiles',
  //       icon: 'fa fa-chevron-right'
  //     }
  //   ]
  // },
  // {
  //   label: 'Incident',
  //   path: '/incident',
  //   icon: 'fa fa-cube',
  //   children: [
  //     {
  //       label: 'Current Incidents',
  //       path: '/incident',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'New Incident',
  //       path: '/incident/edit/new',
  //       icon: 'fa fa-plus'
  //     },
  //     {
  //       label: 'History',
  //       path: '/incident/completed',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'Reports',
  //       path: '/incident/reports',
  //       icon: 'fa fa-chevron-right'
  //     }
  //   ]
  // },
  {
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
];

function padDigits(number, digits) {
  return Array(Math.max((digits - String(number).length) + 1, 0)).join(0) + number;
}

export const getDisplayId = (item) => {
  return new Promise((resolve, reject) => {
    let renderedValue = '';
    let totalItemCount = 0;
    patientDB.info().then((result) => {
      totalItemCount = result.doc_count + result.doc_del_count;
      renderedValue = padDigits(totalItemCount, 5);
      resolve(item + renderedValue);
    }).catch((err) => {
      reject(err);
    });
  });
};

export const getDifferenceDate = (today, target) => {
  const difference = moment.duration(moment(today, 'DD/MM/YYYY HH:mm:ss').diff(moment(target, 'DD/MM/YYYY HH:mm:ss')));
  return difference.humanize();
};

const headerSortingStyle = { backgroundColor: '#c8e6c9' };

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
  { value: 'Admission', label: 'Admission' },
  { value: 'Clinic', label: 'Clinic' },
  { value: 'Followup', label: 'Followup' },
  { value: 'Imaging', label: 'Imaging' },
  { value: 'Lab', label: 'Lab' },
  { value: 'Pharmacy', label: 'Pharmacy' },
];


export const appointmentStatusList = [
  { value: 'Attended', label: 'Attended' },
  { value: 'Scheduled', label: 'Scheduled' },
  { value: 'Canceled', label: 'Canceled' },
  { value: 'Missed', label: 'Missed' },
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

export const patientColumns = [{
  dataField: 'displayId',
  text: 'Id',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '10%'
  },
}, {
  dataField: 'firstName',
  text: 'First Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '12%'
  }
}, {
  dataField: 'lastName',
  text: 'Last Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '12%'
  }
}, {
  dataField: 'sex',
  text: 'Sex',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '10%'
  }
}, {
  dataField: 'birthday',
  text: 'DOB',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '15%'
  }
}, {
  dataField: 'patientStatus',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: Colors.searchTintColor,
    width: '10%'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: Colors.searchTintColor
  },
  formatter: actionButtonFormatter
}];

function actionButtonFormatter(cell, row, rowIndex, formatExtraData) {
  console.log(cell, row, rowIndex, formatExtraData);
  return (
    <div className="container">
      <button className="button column-button">Edit</button>
      <button className="button is-primary column-button">Admit</button>
      <button className="button is-danger column-button">Delete</button>
    </div>
  );
}

export const medicationColumns = [{
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

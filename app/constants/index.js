export const sidebarInfo = [
  {
    label: 'Patients',
    path: '/patients',
    icon: 'fa fa-users',
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
    icon: 'fa fa-calendar',
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
    icon: 'fa fa-file-text-o',
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
    icon: 'fa fa-graduation-cap',
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
    icon: 'fa fa-male',
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

export const idGenerator = () => {
  // eslint-disable-next-line func-names
  const S4 = function () {
    // eslint-disable-next-line no-bitwise
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (`${S4()}`);
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
  { value: 'value1', label: 'Value 1' },
  { value: 'value2', label: 'Value 2' },
  { value: 'value3', label: 'Value 3' },
  { value: 'value4', label: 'Value 4' },
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
  dataField: 'id',
  text: 'id',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'firstName',
  text: 'First Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'lastName',
  text: 'Last Name',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'sex',
  text: 'Sex',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'birthday',
  text: 'DOB',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'patientStatus',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

export const medicationColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'prescriber',
  text: 'Prescriber',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'medication',
  text: 'Medication',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'quantity',
  text: 'Quantity',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'status',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

export const invoiceColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'prescriber',
  text: 'Prescriber',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'medication',
  text: 'Medication',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'quantity',
  text: 'Quantity',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'status',
  text: 'Status',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

export const invoiceLineItemColumns = [{
  dataField: 'description',
  text: 'Description',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'actualCharge',
  text: 'Actual Charges',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'discount',
  text: 'Discount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'national',
  text: 'National Insurance',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'hmo',
  text: 'HMO/COM',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'excess',
  text: 'Excess',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

export const invoicePaymentColumns = [{
  dataField: 'date',
  text: 'Date',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'amount',
  text: 'Amount',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'type',
  text: 'Type',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'notes',
  text: 'Notes',
  sort: true,
  headerSortingStyle,
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Action',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

export const labsColumns = [{
  dataField: 'date',
  text: 'Date Requested',
  headerStyle: {
    backgroundColor: '#d2dae3'
  },
}, {
  dataField: 'patient',
  text: 'Patient',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'requestedBy',
  text: 'Requested By',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'type',
  text: 'Lab Type',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'note',
  text: 'Notes',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}, {
  dataField: 'action',
  text: 'Actions',
  headerStyle: {
    backgroundColor: '#d2dae3'
  }
}];

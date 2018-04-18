export const sidebarInfo = [
  {
    label: 'Patients',
    path: '/patients',
    icon: 'fa fa-cube',
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
    icon: 'fa fa-cube',
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
        path: '/appointments/edit/new',
        icon: 'fa fa-plus'
      }
    ]
  },
  {
    label: 'Imaging',
    path: '/imaging',
    icon: 'fa fa-cube',
    children: [
      {
        label: 'Requests',
        path: '/imaging',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Completed',
        path: '/imaging/completed',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Request',
        path: '/imaging/edit/new',
        icon: 'fa fa-plus'
      }
    ]
  },
  {
    label: 'Medication',
    path: '/medication',
    icon: 'fa fa-cube',
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
    icon: 'fa fa-cube',
    children: [
      {
        label: 'Requests',
        path: '/labs',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Completed',
        path: '/labs/completed',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Request',
        path: '/labs/edit/new',
        icon: 'fa fa-plus'
      }
    ]
  },
  {
    label: 'Billing',
    path: '/invoices',
    icon: 'fa fa-cube',
    children: [
      {
        label: 'Invoices',
        path: '/invoices',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Invoice',
        path: '/invoices/edit/new',
        icon: 'fa fa-plus'
      },
      {
        label: 'Prices',
        path: '/pricing',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Price Profiles',
        path: '/pricing/profiles',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
  {
    label: 'Incident',
    path: '/incident',
    icon: 'fa fa-cube',
    children: [
      {
        label: 'Current Incidents',
        path: '/incident',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'New Incident',
        path: '/incident/edit/new',
        icon: 'fa fa-plus'
      },
      {
        label: 'History',
        path: '/incident/completed',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Reports',
        path: '/incident/reports',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
  {
    label: 'Administration',
    path: '/admin',
    icon: 'fa fa-cube',
    children: [
      {
        label: 'Address Fields',
        path: '/admin/address',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Custom Forms',
        path: '/admin/custom-forms',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Incident Categories',
        path: '/admin/inc-category',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
];

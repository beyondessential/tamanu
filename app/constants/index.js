export const sidebarInfo = [
  {
    label: 'Patients',
    path: '/patients',
    children: [
      {
        label: 'Patient Listing',
        path: '/patients'
      },
      {
        label: 'Admitted Patients',
        path: '/patients/admitted'
      },
      {
        label: 'Outpatient',
        path: '/patients/outpatient'
      },
      {
        label: 'New Patient',
        path: '/patients/edit/new'
      },
      {
        label: 'Reports',
        path: '/patients/reports'
      }
    ]
  },
  {
    label: 'Scheduling',
    path: '/appointments',
    children: [
      {
        label: 'Appointments This Week',
        path: '/appointments'
      },
      {
        label: "Today's Appointments",
        path: '/appointments/today'
      },
      {
        label: 'Search Appointments',
        path: '/appointments/search'
      },
      {
        label: 'Appointments Calendar',
        path: '/appointments/calendar'
      },
      {
        label: 'Add Appointment',
        path: '/appointments/edit/new'
      },
      {
        label: 'Theater Schedule',
        path: '/appointments/theater'
      },
      {
        label: 'Schedule Surgery',
        path: '/appointments/edit/new'
      }
    ]
  },
  {
    label: 'Imaging',
    path: '/imaging',
    children: [
      {
        label: 'Requests',
        path: '/imaging'
      },
      {
        label: 'Completed',
        path: '/imaging/completed'
      },
      {
        label: 'New Request',
        path: '/imaging/edit/new'
      }
    ]
  },
  {
    label: 'Medication',
    path: '/medication',
    children: [
      {
        label: 'Requests',
        path: '/medication'
      },
      {
        label: 'Completed',
        path: '/medication/completed'
      },
      {
        label: 'New Request',
        path: '/medication/edit/new'
      },
      {
        label: 'Dispense',
        path: '/medication/edit/dispense'
      },
      {
        label: 'Return Medication',
        path: '/medication/return/new'
      }
    ]
  },
  {
    label: 'Labs',
    path: '/labs',
    children: [
      {
        label: 'Requests',
        path: '/labs'
      },
      {
        label: 'Completed',
        path: '/labs/completed'
      },
      {
        label: 'New Request',
        path: '/labs/edit/new'
      }
    ]
  },
  {
    label: 'Billing',
    path: '/invoices',
    children: [
      {
        label: 'Invoices',
        path: '/invoices'
      },
      {
        label: 'New Invoice',
        path: '/invoices/edit/new'
      },
      {
        label: 'Prices',
        path: '/pricing'
      },
      {
        label: 'Price Profiles',
        path: '/pricing/profiles'
      }
    ]
  },
  {
    label: 'Incident',
    path: '/incident',
    children: [
      {
        label: 'Current Incidents',
        path: '/incident'
      },
      {
        label: 'New Incident',
        path: '/incident/edit/new'
      },
      {
        label: 'History',
        path: '/incident/completed'
      },
      {
        label: 'Reports',
        path: '/incident/reports'
      }
    ]
  },
  {
    label: 'Administration',
    path: '/admin',
    children: [
      {
        label: 'Address Fields',
        path: '/admin/address'
      },
      {
        label: 'Custom Forms',
        path: '/admin/custom-forms'
      },
      {
        label: 'Incident Categories',
        path: '/admin/inc-category'
      }
    ]
  },
];

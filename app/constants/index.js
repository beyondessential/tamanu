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
  // {
  //   label: 'Labs',
  //   path: '/labs',
  //   icon: 'fa fa-graduation-cap',
  //   children: [
  //     {
  //       label: 'Requests',
  //       path: '/labs',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'Completed',
  //       path: '/labs/completed',
  //       icon: 'fa fa-chevron-right'
  //     },
  //     {
  //       label: 'New Request',
  //       path: '/labs/edit/new',
  //       icon: 'fa fa-plus'
  //     }
  //   ]
  // },
  {
    label: 'Billing',
    path: '/invoices',
    icon: 'fa fa-credit-card',
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
        path: '/invoices/pricing',
        icon: 'fa fa-chevron-right'
      },
      {
        label: 'Price Profiles',
        path: '/invoices/profiles',
        icon: 'fa fa-chevron-right'
      }
    ]
  },
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

export const idGenerator = () => {
  // eslint-disable-next-line func-names
  const S4 = function () {
    // eslint-disable-next-line no-bitwise
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (`${S4() + S4()}-${S4()}-${S4()}-${S4()}-${S4()}${S4()}${S4()}`);
};

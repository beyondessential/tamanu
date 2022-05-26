import {
  administrationIcon,
  labsIcon,
  medicationIcon,
  patientIcon,
  programsIcon,
  radiologyIcon,
  scheduleIcon,
  vaccineIcon,
} from '../../constants/images';

export const submenuIcons = {
  action: 'fa fa-chevron-circle-right',
  calendar: 'fa fa-calendar',
  cog: 'fa fa-cog',
  location: 'fa fa-location-arrow',
  new: 'fa fa-plus',
  permissions: 'fa fa-lock',
  report: 'fa fa-chevron-circle-right',
  search: 'fa fa-search',
  table: 'fa fa-th-list',
  users: 'fa fa-users',
  immunisations: 'fa fa-syringe',
};

export const facilityItems = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'All patients',
        path: '/patients',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Inpatients',
        path: '/patients/admitted',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Emergency patients',
        path: '/patients/triage',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Outpatients',
        path: '/patients/outpatient',
        icon: submenuIcons.table,
        ability: { action: 'read' },
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
        label: 'Upcoming appointments',
        path: '/appointments',
        icon: submenuIcons.table,
        ability: { action: 'read' },
      },
      {
        label: 'Appointments calendar',
        path: '/appointments/calendar',
        icon: submenuIcons.calendar,
        ability: { action: 'read' },
      },
      {
        label: 'Add appointment',
        path: '/appointments/appointment/new',
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
        label: 'New request',
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
        label: 'New request',
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
        label: 'New request',
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
        label: 'Locations',
        path: '/admin/locations',
        icon: submenuIcons.location,
        ability: { action: 'read', subject: 'location' },
      },
      {
        label: 'Permissions',
        path: '/admin/permissions',
        icon: submenuIcons.permissions,
        ability: { action: 'read', subject: 'userRole' },
      },
      {
        label: 'Programs',
        icon: submenuIcons.table,
        path: '/admin/programs',
      },
      {
        label: 'Data import',
        icon: submenuIcons.table,
        path: '/admin/refdata',
      },
    ],
  },
  {
    key: 'programs',
    label: 'Programs',
    path: '/programs',
    icon: programsIcon,
    ability: { action: 'read', subject: 'program' },
    children: [
      {
        label: 'Active COVID-19 patients',
        path: `/programs/active-covid-19-program/patients`,
        icon: submenuIcons.action,
      },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/reports',
    icon: scheduleIcon,
    ability: { action: 'read', subject: 'report' },
    children: [
      {
        label: 'Report generator',
        path: `/reports/`,
        icon: submenuIcons.report,
      },
    ],
  },
  {
    key: 'immunisations',
    label: 'Immunisation',
    path: '/immunisations',
    icon: vaccineIcon,
    ability: { action: 'read' },
    children: [
      {
        label: 'Immunisation register',
        path: `/immunisations/`,
        icon: submenuIcons.immunisations,
      },
      {
        label: 'COVID campaign',
        path: `/immunisations/covid`,
        icon: submenuIcons.immunisations,
      },
    ],
  },
];

export const syncItems = [];

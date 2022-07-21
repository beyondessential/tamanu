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
import { Colors } from '../../constants';

export const FACILITY_MENU_ITEMS = [
  {
    key: 'patients',
    label: 'Patients',
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: 'All patients',
        color: '#7EB3E7',
        path: '/patients',
        ability: { action: 'read' },
      },
      {
        label: 'Inpatients',
        color: Colors.safe,
        path: '/patients/admitted',
        ability: { action: 'read' },
      },
      {
        label: 'Emergency patients',
        color: Colors.orange,
        path: '/patients/triage',
        ability: { action: 'read' },
      },
      {
        label: 'Outpatients',
        color: '#F9BA5B',
        path: '/patients/outpatient',
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
        ability: { action: 'read' },
      },
      {
        label: 'Appointments calendar',
        path: '/appointments/calendar',
        ability: { action: 'read' },
      },
      {
        label: 'New appointment',
        path: '/appointments/appointment/new',
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
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/medication/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/medication/request',
        ability: { action: 'create' },
      },
      {
        label: 'Dispense',
        path: '/medication/dispense',
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
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/imaging/request',
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
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/labs/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/labs/edit/new',
        ability: { action: 'create' },
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
      },
      {
        label: 'COVID campaign',
        path: `/immunisations/covid`,
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
      },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    path: '/admin',
    icon: administrationIcon,
    divider: true,
    ability: { subject: 'user', action: 'read' },
    children: [
      {
        label: 'Settings',
        path: '/admin/settings',
      },
      {
        label: 'Users',
        path: '/admin/users',
        ability: { action: 'read', subject: 'user' },
      },
      {
        label: 'Locations',
        path: '/admin/locations',
        ability: { action: 'read', subject: 'location' },
      },
      {
        label: 'Permissions',
        path: '/admin/permissions',
      },
      {
        label: 'Programs',
        path: '/admin/programs',
      },
      {
        label: 'Data import',
        path: '/admin/refdata',
      },
    ],
  },
];

export const SYNC_MENU_ITEMS = [];

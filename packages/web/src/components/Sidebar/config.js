import {
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
        path: '/patients/all',
        ability: { action: 'read' },
      },
      {
        label: 'Inpatients',
        color: Colors.safe,
        path: '/patients/inpatient',
        ability: { action: 'read' },
      },
      {
        label: 'Emergency patients',
        color: Colors.orange,
        path: '/patients/emergency',
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
        path: '/appointments/all',
        ability: { action: 'read' },
      },
      {
        label: 'Appointments calendar',
        path: '/appointments/calendar',
        ability: { action: 'read' },
      },
      {
        label: 'New appointment',
        path: '/appointments/new',
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'medication',
    label: 'Medication',
    path: '/medication-requests',
    icon: medicationIcon,
    ability: { subject: 'medication' },
    children: [
      {
        label: 'Requests',
        path: '/medication-requests/all',
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/medication-requests/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/medication-requests/new',
        ability: { action: 'create' },
      },
      {
        label: 'Dispense',
        path: '/medication-requests/dispense',
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'imaging',
    label: 'Imaging',
    path: '/imaging-requests',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: 'Requests',
        path: '/imaging-requests/all',
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging-requests/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/imaging-requests/new',
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'labs',
    label: 'Labs',
    path: '/lab-requests',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: 'Requests',
        path: '/lab-requests/all',
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/lab-requests/completed',
        ability: { action: 'read' },
      },
      {
        label: 'New request',
        path: '/lab-requests/new',
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
        path: `/immunisations/all`,
      },
      {
        label: 'COVID campaign',
        path: `/immunisations/covid-campaign`,
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
        path: `/programs/active-covid-19-patients`,
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
        path: `/reports/new`,
      },
    ],
  },
];

export const SYNC_MENU_ITEMS = [
  {
    key: 'refdata',
    label: 'Data import',
    path: '/admin/refdata',
  },
  {
    key: 'permissions',
    label: 'Permissions',
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
  },
  {
    key: 'programs',
    label: 'Programs',
    path: '/admin/programs',
  },
  {
    key: 'patientMerge',
    label: 'Patient merge',
    path: '/admin/patientMerge',
  },
];

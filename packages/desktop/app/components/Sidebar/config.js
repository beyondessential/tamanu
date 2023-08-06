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
        color: Colors.blue,
        path: '/patients/all',
        ability: { action: 'read' },
      },
      {
        label: 'Inpatients',
        color: Colors.green,
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
        label: 'Active requests',
        path: '/imaging-requests/active',
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging-requests/completed',
        ability: { action: 'read' },
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
        label: 'Active requests',
        path: '/lab-requests/all',
        ability: { action: 'read' },
      },
      {
        label: 'Published',
        path: '/lab-requests/published',
        ability: { action: 'read' },
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
    key: 'facilityAdmin',
    label: 'Facility admin',
    path: '/facility-admin',
    ability: { action: 'read', subject: 'patient' },
    divider: true,
    children: [
      {
        label: 'Reports',
        path: `/facility-admin/reports`,
      },
      {
        label: 'Bed management',
        path: `/facility-admin/bed-management`,
      },
    ],
  },
];

export const SYNC_MENU_ITEMS = [
  {
    key: 'referenceData',
    label: 'Reference data',
    path: '/admin/referenceData',
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
  {
    key: 'templates',
    label: 'Templates',
    path: '/admin/templates',
  },
  {
    key: 'assets',
    label: 'Asset upload',
    path: '/admin/assets',
  },
  {
    key: 'sync',
    label: 'Sync status',
    path: '/admin/sync',
  },
  {
    key: 'settings',
    label: 'Settings',
    path: '/admin/settings',
    ability: { action: 'read', subject: 'settings' },
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/admin/reports',
  },
];

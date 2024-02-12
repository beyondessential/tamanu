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
import { ProgramRegistrySidebarItem } from '../../views/programRegistry/ProgramRegistrySidebarItem';

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
        key: 'patientsAll',
        ability: { action: 'read' },
      },
      {
        label: 'Inpatients',
        color: Colors.green,
        path: '/patients/inpatient',
        key: 'patientsInpatients',
        ability: { action: 'read' },
      },
      {
        label: 'Emergency patients',
        color: Colors.orange,
        path: '/patients/emergency',
        key: 'patientsEmergency',
        ability: { action: 'read' },
      },
      {
        label: 'Outpatients',
        color: '#F9BA5B',
        path: '/patients/outpatient',
        key: 'patientsOutpatients',
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
        key: 'schedulingAll',
        ability: { action: 'read' },
      },
      {
        label: 'Appointments calendar',
        path: '/appointments/calendar',
        key: 'schedulingCalendar',
        ability: { action: 'read' },
      },
      {
        label: 'New appointment',
        path: '/appointments/new',
        key: 'schedulingNew',
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
        key: 'medicationRequests',
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
        key: 'imagingActive',
        ability: { action: 'read' },
      },
      {
        label: 'Completed',
        path: '/imaging-requests/completed',
        key: 'imagingCompleted',
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
        key: 'labsRequests',
        ability: { action: 'read' },
      },
      {
        label: 'Published',
        path: '/lab-requests/published',
        key: 'labsPublished',
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
        key: `immunisationsAll`,
      },
    ],
  },
  {
    key: 'programRegistry',
    label: 'Program registry',
    path: '/program-registry',
    icon: programsIcon,
    component: ProgramRegistrySidebarItem,
    ability: { action: 'read', subject: 'programRegistry' },
    children: [],
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
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
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
    key: 'fhirJobStats',
    label: 'FHIR job stats',
    path: '/admin/fhir/jobStats',
  },
  {
    key: 'reports',
    label: 'Reports',
    path: '/admin/reports',
  },
];

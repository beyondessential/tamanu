import React from 'react';
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
import { TranslatedText } from '../Translation/TranslatedText';
import { ProgramRegistrySidebarItem } from '../../views/programRegistry/ProgramRegistrySidebarItem';

export const FACILITY_MENU_ITEMS = [
  {
    key: 'patients',
    label: <TranslatedText stringId="sidebar.patients" fallback="Patients" />,
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: <TranslatedText stringId="sidebar.patients.all" fallback="All patients" />,
        color: Colors.blue,
        path: '/patients/all',
        key: 'patientsAll',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.patients.inpatients" fallback="Inpatients" />,
        color: Colors.green,
        path: '/patients/inpatient',
        key: 'patientsInpatients',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.patients.emergency" fallback="Emergency patients" />
        ),
        color: Colors.orange,
        path: '/patients/emergency',
        key: 'patientsEmergency',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.patients.outpatients" fallback="Outpatients" />,
        color: '#F9BA5B',
        path: '/patients/outpatient',
        key: 'patientsOutpatients',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'scheduling',
    label: <TranslatedText stringId="sidebar.scheduling" fallback="Scheduling" />,
    path: '/appointments',
    icon: scheduleIcon,
    ability: { subject: 'appointment' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.scheduling.upcomingAppointments"
            fallback="Upcoming appointments"
          />
        ),
        path: '/appointments/all',
        key: 'schedulingAppointments',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.scheduling.calendar" fallback="Appointments calendar" />
        ),
        path: '/appointments/calendar',
        key: 'schedulingCalendar',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.scheduling.newAppointment" fallback="New appointment" />
        ),
        path: '/appointments/new',
        key: 'schedulingNew',
        ability: { action: 'create' },
      },
    ],
  },
  {
    key: 'medication',
    label: <TranslatedText stringId="sidebar.medication" fallback="Medication" />,
    path: '/medication-requests',
    icon: medicationIcon,
    ability: { subject: 'medication' },
    children: [
      {
        label: <TranslatedText stringId="sidebar.medication.requests" fallback="Requests" />,
        path: '/medication-requests/all',
        key: 'medicationAll',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'imaging',
    label: <TranslatedText stringId="sidebar.imaging" fallback="Imaging" />,
    path: '/imaging-requests',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: <TranslatedText stringId="sidebar.imaging.active" fallback="Active requests" />,
        path: '/imaging-requests/active',
        key: 'imagingActive',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.imaging.completed" fallback="Completed" />,
        path: '/imaging-requests/completed',
        key: 'imagingCompleted',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'labs',
    label: <TranslatedText stringId="sidebar.labs" fallback="Labs" />,
    path: '/lab-requests',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: <TranslatedText stringId="sidebar.labs.active" fallback="Active requests" />,
        path: '/lab-requests/all',
        key: 'labsAll',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.labs.published" fallback="Published" />,
        path: '/lab-requests/published',
        key: 'labsPublished',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'immunisations',
    label: <TranslatedText stringId="sidebar.immunisations" fallback="Immunisation" />,
    path: '/immunisations',
    icon: vaccineIcon,
    ability: { action: 'read' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.immunisations.register"
            fallback="Immunisation register"
          />
        ),
        path: '/immunisations/all',
        key: 'immunisationsAll',
      },
    ],
  },
  {
    key: 'programRegistry',
    label: <TranslatedText stringId="sidebar.programRegistry" fallback="Program Registry" />,
    path: '/program-registry',
    icon: programsIcon,
    Component: ProgramRegistrySidebarItem,
    ability: { action: 'read', subject: 'programRegistry' },
    children: [],
  },
  {
    key: 'facilityAdmin',
    label: <TranslatedText stringId="sidebar.facilityAdmin" fallback="Facility admin" />,
    path: '/facility-admin',
    ability: { action: 'read', subject: 'patient' },
    divider: true,
    children: [
      {
        label: <TranslatedText stringId="sidebar.facilityAdmin.reports" fallback="Reports" />,
        key: 'reports',
        path: `/facility-admin/reports`,
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.facilityAdmin.bedManagement"
            fallback="Bed management"
          />
        ),
        key: 'bedManagement',
        path: `/facility-admin/bed-management`,
      },
    ],
  },
];

export const SYNC_MENU_ITEMS = [
  {
    key: 'referenceData',
    label: <TranslatedText stringId="adminSidebar.referenceData" fallback="Reference data" />,
    path: '/admin/referenceData',
  },
  {
    key: 'permissions',
    label: <TranslatedText stringId="adminSidebar.permissions" fallback="Permissions" />,
    path: '/admin/permissions',
    ability: { action: 'read', subject: 'userRole' },
  },
  {
    key: 'programs',
    label: <TranslatedText stringId="adminSidebar.programs" fallback="Programs" />,
    path: '/admin/programs',
  },
  {
    key: 'surveyResponses',
    label: 'Survey Responses',
    path: '/admin/surveyResponses',
  },
  {
    key: 'patientMerge',
    label: <TranslatedText stringId="adminSidebar.patientMerge" fallback="Patient merge" />,
    path: '/admin/patientMerge',
  },
  {
    key: 'templates',
    label: <TranslatedText stringId="adminSidebar.templates" fallback="Templates" />,
    path: '/admin/templates',
  },
  {
    key: 'translation',
    label: <TranslatedText stringId="adminSidebar.translation" fallback="Translation" />,
    path: '/admin/translation',
    ability: { action: 'write', subject: 'translation' },
  },
  {
    key: 'assets',
    label: <TranslatedText stringId="adminSidebar.assetUpload" fallback="Asset upload" />,
    path: '/admin/assets',
  },
  {
    key: 'sync',
    label: <TranslatedText stringId="adminSidebar.syncStatus" fallback="Sync status" />,
    path: '/admin/sync',
  },
  {
    key: 'fhirJobStats',
    label: <TranslatedText stringId="adminSidebar.fhirJobStats" fallback="FHIR job stats" />,
    path: '/admin/fhir/jobStats',
  },
  {
    key: 'reports',
    label: <TranslatedText stringId="adminSidebar.reports" fallback="Reports" />,
    path: '/admin/reports',
  },
];

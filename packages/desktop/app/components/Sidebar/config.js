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

export const FACILITY_MENU_ITEMS = [
  {
    key: 'patients',
    label: <TranslatedText stringId="sidebar.patients" fallback="Patients" />,
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: <TranslatedText stringId="sidebar.patients.all" fallback="All Patients" />,
        color: Colors.blue,
        path: '/patients/all',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.patients.inpatients" fallback="Inpatients" />,
        color: Colors.green,
        path: '/patients/inpatient',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.patients.emergency" fallback="Emergency Patients" />
        ),
        color: Colors.orange,
        path: '/patients/emergency',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.patients.outpatients" fallback="Outpatients" />,
        color: '#F9BA5B',
        path: '/patients/outpatient',
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
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.scheduling.calendar" fallback="Appointments calendar" />
        ),
        path: '/appointments/calendar',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText stringId="sidebar.scheduling.newAppointment" fallback="New appointment" />
        ),
        path: '/appointments/new',
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
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.imaging.completed" fallback="Completed" />,
        path: '/imaging-requests/completed',
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
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText stringId="sidebar.labs.published" fallback="Published" />,
        path: '/lab-requests/published',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'immunisations',
    label: <TranslatedText stringId="sidebar.immunisations" fallback="Immunisations" />,
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
        path: `/immunisations/all`,
      },
    ],
  },
  {
    key: 'programs',
    label: <TranslatedText stringId="sidebar.programs" fallback="Programs" />,
    path: '/programs',
    icon: programsIcon,
    ability: { action: 'read', subject: 'program' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.programs.activeCovid19Patients"
            fallback="Active COVID-19 patients"
          />
        ),
        path: `/programs/active-covid-19-patients`,
      },
    ],
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
        path: `/facility-admin/reports`,
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.facilityAdmin.bedManagement"
            fallback="Bed Management"
          />
        ),
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
    label: 'Translation',
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
    label: 'FHIR job stats',
    path: '/admin/fhir/jobStats',
  },
  {
    key: 'reports',
    label: <TranslatedText stringId="adminSidebar.reports" fallback="Reports" />,
    path: '/admin/reports',
  },
];

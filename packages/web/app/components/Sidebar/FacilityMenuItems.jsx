import React from 'react';
import {
  labsIcon,
  medicationIcon,
  patientIcon,
  programsIcon,
  radiologyIcon,
  scheduleIcon,
  vaccineIcon,
  dashboardIcon,
} from '../../constants/images';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { ProgramRegistrySidebarItem } from '../../views/programRegistry/ProgramRegistrySidebarItem';

export const FACILITY_MENU_ITEMS = [
  {
    key: 'dashboard',
    label: <TranslatedText
      stringId="sidebar.dashboard"
      fallback="Dashboard"
      data-testid='translatedtext-4n3n' />,
    path: '/dashboard',
    icon: dashboardIcon,
    ability: { action: 'read' },
  },
  {
    key: 'patients',
    label: <TranslatedText
      stringId="sidebar.patients"
      fallback="Patients"
      data-testid='translatedtext-63wj' />,
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: <TranslatedText
          stringId="sidebar.patients.all"
          fallback="All patients"
          data-testid='translatedtext-mhe5' />,
        color: Colors.blue,
        path: '/patients/all',
        key: 'patientsAll',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText
          stringId="sidebar.patients.inpatients"
          fallback="Inpatients"
          data-testid='translatedtext-wye5' />,
        color: Colors.green,
        path: '/patients/inpatient',
        key: 'patientsInpatients',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.patients.emergency"
            fallback="Emergency patients"
            data-testid='translatedtext-iegr' />
        ),
        color: Colors.orange,
        path: '/patients/emergency',
        key: 'patientsEmergency',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText
          stringId="sidebar.patients.outpatients"
          fallback="Outpatients"
          data-testid='translatedtext-8u7f' />,
        color: '#F9BA5B',
        path: '/patients/outpatient',
        key: 'patientsOutpatients',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'scheduling',
    label: <TranslatedText
      stringId="sidebar.scheduling"
      fallback="Scheduling"
      data-testid='translatedtext-8qbd' />,
    path: '/appointments',
    icon: scheduleIcon,
    ability: { subject: 'appointment' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.scheduling.outpatientAppointments"
            fallback="Outpatient appointments"
            data-testid='translatedtext-v8ha' />
        ),
        path: '/appointments/outpatients',
        key: 'schedulingOutpatients',
        ability: { action: 'read' },
      },
      {
        key: 'schedulingLocations',
        path: '/appointments/locations',
        label: (
          <TranslatedText
            stringId="sidebar.scheduling.locations"
            fallback="Location bookings"
            data-testid='translatedtext-gne8' />
        ),
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'medication',
    label: <TranslatedText
      stringId="sidebar.medication"
      fallback="Medication"
      data-testid='translatedtext-e2jk' />,
    path: '/medication-requests',
    icon: medicationIcon,
    ability: { subject: 'medication' },
    children: [
      {
        label: <TranslatedText
          stringId="sidebar.medication.requests"
          fallback="Requests"
          data-testid='translatedtext-sbes' />,
        path: '/medication-requests/all',
        key: 'medicationAll',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'imaging',
    label: <TranslatedText
      stringId="sidebar.imaging"
      fallback="Imaging"
      data-testid='translatedtext-wxbl' />,
    path: '/imaging-requests',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: <TranslatedText
          stringId="sidebar.imaging.active"
          fallback="Active requests"
          data-testid='translatedtext-zlru' />,
        path: '/imaging-requests/active',
        key: 'imagingActive',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText
          stringId="sidebar.imaging.completed"
          fallback="Completed"
          data-testid='translatedtext-5oxv' />,
        path: '/imaging-requests/completed',
        key: 'imagingCompleted',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'labs',
    label: <TranslatedText stringId="sidebar.labs" fallback="Labs" data-testid='translatedtext-jhb2' />,
    path: '/lab-requests',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: <TranslatedText
          stringId="sidebar.labs.active"
          fallback="Active requests"
          data-testid='translatedtext-ej3k' />,
        path: '/lab-requests/all',
        key: 'labsAll',
        ability: { action: 'read' },
      },
      {
        label: <TranslatedText
          stringId="sidebar.labs.published"
          fallback="Published"
          data-testid='translatedtext-sk0p' />,
        path: '/lab-requests/published',
        key: 'labsPublished',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'immunisations',
    label: <TranslatedText
      stringId="sidebar.immunisations"
      fallback="Immunisation"
      data-testid='translatedtext-s0wl' />,
    path: '/immunisations',
    icon: vaccineIcon,
    ability: { action: 'read' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.immunisations.register"
            fallback="Immunisation register"
            data-testid='translatedtext-4iwo' />
        ),
        path: '/immunisations/all',
        key: 'immunisationsAll',
      },
    ],
  },
  {
    key: 'programRegistry',
    label: <TranslatedText
      stringId="sidebar.programRegistry"
      fallback="Program Registry"
      data-testid='translatedtext-knky' />,
    path: '/program-registry',
    icon: programsIcon,
    Component: ProgramRegistrySidebarItem,
    ability: { action: 'read', subject: 'programRegistry' },
    children: [],
  },
  {
    key: 'facilityAdmin',
    label: <TranslatedText
      stringId="sidebar.facilityAdmin"
      fallback="Facility admin"
      data-testid='translatedtext-msng' />,
    path: '/facility-admin',
    ability: { action: 'read', subject: 'patient' },
    divider: true,
    children: [
      {
        label: <TranslatedText
          stringId="sidebar.facilityAdmin.reports"
          fallback="Reports"
          data-testid='translatedtext-dkp9' />,
        key: 'reports',
        path: '/facility-admin/reports',
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.facilityAdmin.bedManagement"
            fallback="Bed management"
            data-testid='translatedtext-8i0n' />
        ),
        key: 'bedManagement',
        path: '/facility-admin/bed-management',
      },
    ],
  },
];

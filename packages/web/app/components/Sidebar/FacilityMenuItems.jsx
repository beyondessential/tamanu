import React from 'react';
import {
  labsIcon,
  patientIcon,
  programsIcon,
  radiologyIcon,
  scheduleIcon,
  vaccineIcon,
  dashboardIcon,
  medicationIcon,
} from '../../constants/images';
import { Colors } from '../../constants';
import { TranslatedText } from '../Translation/TranslatedText';
import { ProgramRegistrySidebarItem } from '../../views/programRegistry/ProgramRegistrySidebarItem';

export const FACILITY_MENU_ITEMS = [
  {
    key: 'dashboard',
    label: (
      <TranslatedText
        stringId="sidebar.dashboard"
        fallback="Dashboard"
        data-testid="translatedtext-t906"
      />
    ),
    path: '/dashboard',
    icon: dashboardIcon,
    ability: { action: 'read' },
  },
  {
    key: 'patients',
    label: (
      <TranslatedText
        stringId="sidebar.patients"
        fallback="Patients"
        data-testid="translatedtext-ew4j"
      />
    ),
    path: '/patients',
    icon: patientIcon,
    ability: { subject: 'patient' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.patients.all"
            fallback="All patients"
            data-testid="translatedtext-7oku"
          />
        ),
        color: Colors.blue,
        path: '/patients/all',
        key: 'patientsAll',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.patients.inpatients"
            fallback="Inpatients"
            data-testid="translatedtext-tjv8"
          />
        ),
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
            data-testid="translatedtext-sn91"
          />
        ),
        color: Colors.orange,
        path: '/patients/emergency',
        key: 'patientsEmergency',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.patients.outpatients"
            fallback="Outpatients"
            data-testid="translatedtext-433j"
          />
        ),
        color: '#F9BA5B',
        path: '/patients/outpatient',
        key: 'patientsOutpatients',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'scheduling',
    label: (
      <TranslatedText
        stringId="sidebar.scheduling"
        fallback="Scheduling"
        data-testid="translatedtext-46ib"
      />
    ),
    path: '/appointments',
    icon: scheduleIcon,
    ability: { subject: 'appointment' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.scheduling.outpatientAppointments"
            fallback="Outpatient appointments"
            data-testid="translatedtext-xdqn"
          />
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
            data-testid="translatedtext-mrfi"
          />
        ),
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'medication',
    label: (
      <TranslatedText
        stringId="sidebar.medication"
        fallback="Medication"
        data-testid="translatedtext-2132"
      />
    ),
    path: '/medication',
    icon: medicationIcon,
    abilities: [
      { subject: 'MedicationRequest', action: 'read' },
      { subject: 'MedicationDispense', action: 'read' },
    ],
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.medication.active"
            fallback="Active requests"
            data-testid="translatedtext-2133"
          />
        ),
        path: '/medication/active',
        key: 'medicationActive',
        abilities: [{ subject: 'MedicationRequest', action: 'read' }],
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.medication.dispensed"
            fallback="Dispensed medications"
            data-testid="translatedtext-2134"
          />
        ),
        path: '/medication/dispensed',
        key: 'medicationDispensed',
        abilities: [{ subject: 'MedicationDispense', action: 'read' }],
      },
    ],
  },
  {
    key: 'imaging',
    label: (
      <TranslatedText
        stringId="sidebar.imaging"
        fallback="Imaging"
        data-testid="translatedtext-5sly"
      />
    ),
    path: '/imaging-requests',
    icon: radiologyIcon,
    ability: { subject: 'imaging' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.imaging.active"
            fallback="Active requests"
            data-testid="translatedtext-qsu2"
          />
        ),
        path: '/imaging-requests/active',
        key: 'imagingActive',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.imaging.completed"
            fallback="Completed"
            data-testid="translatedtext-wssk"
          />
        ),
        path: '/imaging-requests/completed',
        key: 'imagingCompleted',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'labs',
    label: (
      <TranslatedText stringId="sidebar.labs" fallback="Labs" data-testid="translatedtext-9bsv" />
    ),
    path: '/lab-requests',
    icon: labsIcon,
    ability: { subject: 'lab' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.labs.active"
            fallback="Active requests"
            data-testid="translatedtext-lhz4"
          />
        ),
        path: '/lab-requests/all',
        key: 'labsAll',
        ability: { action: 'read' },
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.labs.published"
            fallback="Published"
            data-testid="translatedtext-gtx9"
          />
        ),
        path: '/lab-requests/published',
        key: 'labsPublished',
        ability: { action: 'read' },
      },
    ],
  },
  {
    key: 'immunisations',
    label: (
      <TranslatedText
        stringId="sidebar.immunisations"
        fallback="Immunisation"
        data-testid="translatedtext-sko8"
      />
    ),
    path: '/immunisations',
    icon: vaccineIcon,
    ability: { action: 'read' },
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.immunisations.register"
            fallback="Immunisation register"
            data-testid="translatedtext-ygf1"
          />
        ),
        path: '/immunisations/all',
        key: 'immunisationsAll',
      },
    ],
  },
  {
    key: 'programRegistry',
    label: (
      <TranslatedText
        stringId="sidebar.programRegistry"
        fallback="Program Registry"
        data-testid="translatedtext-h6s3"
      />
    ),
    path: '/program-registry',
    icon: programsIcon,
    Component: ProgramRegistrySidebarItem,
    ability: { action: 'read', subject: 'programRegistry' },
    children: [],
  },
  {
    key: 'facilityAdmin',
    label: (
      <TranslatedText
        stringId="sidebar.facilityAdmin"
        fallback="Facility admin"
        data-testid="translatedtext-vs86"
      />
    ),
    path: '/facility-admin',
    ability: { action: 'read', subject: 'patient' },
    divider: true,
    children: [
      {
        label: (
          <TranslatedText
            stringId="sidebar.facilityAdmin.reports"
            fallback="Reports"
            data-testid="translatedtext-yyc2"
          />
        ),
        key: 'reports',
        path: '/facility-admin/reports',
      },
      {
        label: (
          <TranslatedText
            stringId="sidebar.facilityAdmin.bedManagement"
            fallback="Bed management"
            data-testid="translatedtext-zp56"
          />
        ),
        key: 'bedManagement',
        path: '/facility-admin/bed-management',
      },
    ],
  },
];

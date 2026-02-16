import React from 'react';
import { PrescriptionPrintout as Component } from '@tamanu/shared/utils/patientCertificates';
import Watermark from '../assets/watermark.png';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';

export default {
  title: 'pdfs/PrescriptionPrintout',
  component: Component,
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

const patient = {
  id: '36534bf8-95b9-40e5-9808-f29e1e11bede',
  displayId: 'QTQR163687',
  firstName: 'Scott',
  middleName: 'Chester',
  lastName: 'De Angelis',
  culturalName: 'Oscar',
  dateOfBirth: '2014-02-28',
  dateOfDeath: null,
  sex: 'male',
  email: null,
  visibilityStatus: 'current',
  updatedAtSyncTick: '-999',
  createdAt: '2023-11-07T02:15:48.658Z',
  updatedAt: '2023-11-07T02:15:48.658Z',
  deletedAt: null,
  villageId: 'village-Naqiri',
  mergedIntoId: null,
  markedForSyncFacilities: [
    {
      id: 'facility-1',
      code: 'facility-1',
      name: 'facility-1',
      email: null,
      contactNumber: null,
      streetAddress: null,
      cityTown: null,
      division: null,
      type: null,
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:15:33.536Z',
      updatedAt: '2023-11-07T02:15:33.536Z',
      deletedAt: null,
      PatientFacility: {
        id: '36534bf8-95b9-40e5-9808-f29e1e11bede;facility-1',
        patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
        facilityId: 'facility-1',
        updatedAtSyncTick: '39788',
        createdAt: null,
        updatedAt: null,
        deletedAt: null,
        PatientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
        FacilityId: 'facility-1',
      },
    },
  ],
  markedForSync: true,
};

const prescriber = {
  id: 'cee8c94a-8bcc-4be7-863f-07560431262d',
  displayId: null,
  email: 'admin@tamanu.io',
  displayName: 'Initial Admin',
  role: 'admin',
  visibilityStatus: 'current',
  updatedAtSyncTick: '56630',
  createdAt: '2023-11-07T02:11:36.701Z',
  updatedAt: '2024-01-19T02:57:22.560Z',
  deletedAt: null,
};

const prescriptions = [
  {
    id: '61d619a0-8432-47f7-b81d-b73bbaeeab39',
    date: '2024-01-18 15:07:40',
    prescription: 'lkjlk',
    note: '',
    indication: '',
    route: 'ear',
    qtyMorning: 0,
    qtyLunch: 0,
    qtyEvening: 0,
    qtyNight: 0,
    quantity: '1',
    updatedAtSyncTick: '54582',
    createdAt: '2024-01-18T02:07:45.628Z',
    updatedAt: '2024-01-18T02:07:45.628Z',
    encounterId: '593c0580-6570-4c9e-bca3-74c62502c244',
    prescriberId: '00000000-0000-0000-0000-000000000000',
    medicationId: 'drug-adapalene0130',
    medication: {
      id: 'drug-adapalene0130',
      code: 'adapalene0130',
      type: 'drug',
      name: 'Adapalene 0.1% ww Gel 30g',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:15:34.721Z',
      updatedAt: '2023-11-07T02:15:34.721Z',
      deletedAt: null,
    },
    encounter: {
      id: '593c0580-6570-4c9e-bca3-74c62502c244',
      encounterType: 'admission',
      startDate: '2024-01-18 15:07:27',
      endDate: null,
      reasonForEncounter: null,
      deviceId: null,
      plannedLocationStartTime: null,
      updatedAtSyncTick: '54582',
      createdAt: '2024-01-18T02:07:34.667Z',
      updatedAt: '2024-01-18T02:07:34.667Z',
      deletedAt: null,
      patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
      examinerId: '1921ba8a-99db-4c46-aa94-1c2e3c38fde5',
      locationId: 'location-Outpatient-tamanu',
      plannedLocationId: null,
      departmentId: 'department-InfectiousDisease-tamanu',
      patientBillingTypeId: null,
      referralSourceId: null,
    },
    prescriber: {
      id: '00000000-0000-0000-0000-000000000000',
      displayId: null,
      email: 'system@tamanu.io',
      displayName: 'System',
      role: 'system',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:11:36.701Z',
      updatedAt: '2023-11-07T02:11:36.701Z',
      deletedAt: null,
    },
    repeats: 3,
  },
  {
    id: '756cb887-4455-4476-97ab-0354c2caf6a7',
    date: '2024-01-18 15:11:48',
    prescription: 'fdsafdsa',
    note: '',
    indication: '',
    route: 'intramuscular',
    qtyMorning: 0,
    qtyLunch: 0,
    qtyEvening: 0,
    qtyNight: 0,
    quantity: 0,
    updatedAtSyncTick: '54602',
    createdAt: '2024-01-18T02:11:53.908Z',
    updatedAt: '2024-01-18T02:11:53.908Z',
    encounterId: '593c0580-6570-4c9e-bca3-74c62502c244',
    prescriberId: '8cd88ce3-7a1e-4a4c-9ce8-5e57062ba396',
    medicationId: 'drug-aciclovir400',
    medication: {
      id: 'drug-aciclovir400',
      code: 'aciclovir400',
      type: 'drug',
      name: 'Aciclovir 400mg Tablets',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:15:34.721Z',
      updatedAt: '2023-11-07T02:15:34.721Z',
      deletedAt: null,
    },
    encounter: {
      id: '593c0580-6570-4c9e-bca3-74c62502c244',
      encounterType: 'admission',
      startDate: '2024-01-18 15:07:27',
      endDate: null,
      reasonForEncounter: null,
      deviceId: null,
      plannedLocationStartTime: null,
      updatedAtSyncTick: '54582',
      createdAt: '2024-01-18T02:07:34.667Z',
      updatedAt: '2024-01-18T02:07:34.667Z',
      deletedAt: null,
      patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
      examinerId: '1921ba8a-99db-4c46-aa94-1c2e3c38fde5',
      locationId: 'location-Outpatient-tamanu',
      plannedLocationId: null,
      departmentId: 'department-InfectiousDisease-tamanu',
      patientBillingTypeId: null,
      referralSourceId: null,
    },
    prescriber: {
      id: '8cd88ce3-7a1e-4a4c-9ce8-5e57062ba396',
      displayId: null,
      email: 'test@tamanu.io',
      displayName: 'test',
      role: 'admin',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:11:36.701Z',
      updatedAt: '2023-11-07T02:11:36.701Z',
      deletedAt: null,
    },
    repeats: 0,
  },
];

const facility = {
  id: 'facility-1',
  code: 'facility-1',
  name: 'facility-1',
  visibilityStatus: 'current',
  updatedAtSyncTick: '-999',
  createdAt: '2023-11-07T02:15:33.536Z',
  updatedAt: '2023-11-07T02:15:33.536Z',
};

const getLocalisation = key => {
  const config = {};
  return config[key];
};

export const PrescriptionPrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        patientData={patient}
        prescriptions={prescriptions}
        prescriber={prescriber}
        facility={facility}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  ),
};

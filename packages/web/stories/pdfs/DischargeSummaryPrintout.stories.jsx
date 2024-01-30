import { DischargeSummaryPrintout as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/DischargeSummaryPrintout',
  component: Component,
};

const getSetting = key => {
  const config = {
    'localisation.templates.letterhead.title': 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
    'localisation.templates.letterhead.subTitle': 'PO Box 12345, Melbourne, Australia',
    'localisation.templates.vaccineCertificate.emailAddress': 'tamanu@health.govt',
    'localisation.templates.vaccineCertificate.contactNumber': '123456',
    'localisation.fields.firstName.longLabel': 'First Name',
    'localisation.fields.lastName.longLabel': 'Last Name',
    'localisation.fields.dateOfBirth.longLabel': 'Date of Birth',
    'localisation.fields.sex.longLabel': 'Sex',
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const patient = {
  loading: false,
  id: '36534bf8-95b9-40e5-9808-f29e1e11bede',
  error: null,
  issues: [],
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

const encounter = {
  id: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
  encounterType: 'admission',
  startDate: '2024-01-18 13:25:40',
  endDate: '2024-01-18 13:26:40',
  updatedAtSyncTick: '54178',
  createdAt: '2024-01-18T00:25:45.476Z',
  updatedAt: '2024-01-18T00:26:51.442Z',
  patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
  examinerId: '00000000-0000-0000-0000-000000000000',
  locationId: 'location-Home-tamanu',
  departmentId: 'department-Cardiology-tamanu',
  department: {
    id: 'department-Cardiology-tamanu',
    code: 'Cardiology',
    name: 'Cardiology',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-11-07T02:15:47.345Z',
    updatedAt: '2023-11-07T02:15:47.345Z',
    facilityId: 'facility-1',
  },
  examiner: {
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
  location: {
    id: 'location-Home-tamanu',
    code: 'THHome',
    name: 'Home',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-11-07T02:15:48.131Z',
    updatedAt: '2023-11-07T02:15:48.131Z',
    facilityId: 'facility-1',
    locationGroupId: 'locationgroup-Home-tamanu',
    facility: {
      id: 'facility-1',
      code: 'facility-1',
      name: 'facility-1',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:15:33.536Z',
      updatedAt: '2023-11-07T02:15:33.536Z',
    },
    locationGroup: {
      id: 'locationgroup-Home-tamanu',
      code: 'Home',
      name: 'Home Visit',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:15:33.860Z',
      updatedAt: '2023-11-07T02:15:33.860Z',
      facilityId: 'facility-1',
    },
  },
  diagnoses: [
    {
      id: 'cde082f1-ee28-47e8-aec5-cdfb5d34b8e4',
      certainty: 'suspected',
      isPrimary: true,
      date: '2024-01-18 13:25:48',
      updatedAtSyncTick: '54174',
      createdAt: '2024-01-18T00:25:51.161Z',
      updatedAt: '2024-01-18T00:25:51.161Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      diagnosisId: 'icd10-B24-aids',
      diagnosis: {
        id: 'icd10-B24-aids',
        code: 'B24',
        type: 'icd10',
        name: 'AIDS',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:34.721Z',
        updatedAt: '2023-11-07T02:15:34.721Z',
        deletedAt: null,
      },
    },
    {
      id: '6d8fbe0a-53ae-43d3-a33f-41ed1380c993',
      certainty: 'suspected',
      isPrimary: false,
      date: '2024-01-18 13:25:51',
      updatedAtSyncTick: '54174',
      createdAt: '2024-01-18T00:25:56.152Z',
      updatedAt: '2024-01-18T00:25:56.152Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      diagnosisId: 'icd10-A49-9-acute-bacterial-infection',
      diagnosis: {
        id: 'icd10-A49-9-acute-bacterial-infection',
        code: 'A49.9',
        type: 'icd10',
        name: 'Acute bacterial infection',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:45.147Z',
        updatedAt: '2023-11-07T02:15:45.147Z',
        deletedAt: null,
      },
    },
  ],
  procedures: [
    {
      id: 'b448f008-c4bb-43ce-9ab6-6db5fe1b199c',
      completed: false,
      date: '2024-01-18 13:25:58',
      startTime: '2024-01-18 13:25:58',
      updatedAtSyncTick: '54178',
      createdAt: '2024-01-18T00:26:07.019Z',
      updatedAt: '2024-01-18T00:26:07.019Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      locationId: 'location-Theatre2-tamanu',
      procedureTypeId: 'procedure-47381',
      physicianId: 'cee8c94a-8bcc-4be7-863f-07560431262d',
      location: {
        id: 'location-Theatre2-tamanu',
        code: 'THTheatre2',
        name: 'Theatre 2',
        visibilityStatus: 'current',
        maxOccupancy: 1,
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:48.131Z',
        updatedAt: '2023-11-07T02:15:48.131Z',
        deletedAt: null,
        facilityId: 'facility-1',
        locationGroupId: 'locationgroup-Theatre1-tamanu',
      },
      procedureType: {
        id: 'procedure-47381',
        code: '47381',
        type: 'procedureType',
        name: 'Ablation, open, of 1 or more liver tumor(s); cryosurgical',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:34.721Z',
        updatedAt: '2023-11-07T02:15:34.721Z',
        deletedAt: null,
      },
    },
    {
      id: 'ef921016-5fb1-472c-8b57-9550055989d0',
      completed: false,
      date: '2024-01-18 13:27:22',
      startTime: '2024-01-18 13:27:22',
      updatedAtSyncTick: '54186',
      createdAt: '2024-01-18T00:27:28.198Z',
      updatedAt: '2024-01-18T00:27:28.198Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      locationId: 'location-Home-tamanu',
      procedureTypeId: 'procedure-24930',
      physicianId: '1921ba8a-99db-4c46-aa94-1c2e3c38fde5',
      location: {
        id: 'location-Home-tamanu',
        code: 'THHome',
        name: 'Home',
        visibilityStatus: 'current',
        maxOccupancy: null,
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:48.131Z',
        updatedAt: '2023-11-07T02:15:48.131Z',
        deletedAt: null,
        facilityId: 'facility-1',
        locationGroupId: 'locationgroup-Home-tamanu',
      },
      procedureType: {
        id: 'procedure-24930',
        code: '24930',
        type: 'procedureType',
        name: 'Amputation, arm through humerus; re-amputation',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:34.721Z',
        updatedAt: '2023-11-07T02:15:34.721Z',
        deletedAt: null,
      },
    },
  ],
  medications: [
    {
      id: '478facf8-4f74-4b7f-b3c0-61081ec9cdf2',
      date: '2024-01-18 13:26:10',
      prescription: ',m',
      note: '',
      indication: '',
      route: 'eye',
      qtyMorning: 0,
      qtyLunch: 0,
      qtyEvening: 0,
      qtyNight: 0,
      quantity: 1,
      repeats: 4,
      isDischarge: true,
      updatedAtSyncTick: '54178',
      createdAt: '2024-01-18T00:26:17.953Z',
      updatedAt: '2024-01-18T00:26:51.403Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      prescriberId: '8cd88ce3-7a1e-4a4c-9ce8-5e57062ba396',
      medicationId: 'drug-aciclovir800',
      medication: {
        id: 'drug-aciclovir800',
        code: 'aciclovir800',
        type: 'drug',
        name: 'Aciclovir 800mg Tablets',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:45.147Z',
        updatedAt: '2023-11-07T02:15:45.147Z',
        deletedAt: null,
      },
      encounter: {
        id: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
        encounterType: 'admission',
        startDate: '2024-01-18 13:25:40',
        endDate: '2024-01-18 13:26:40',
        reasonForEncounter: null,
        deviceId: null,
        plannedLocationStartTime: null,
        updatedAtSyncTick: '54178',
        createdAt: '2024-01-18T00:25:45.476Z',
        updatedAt: '2024-01-18T00:26:51.442Z',
        deletedAt: null,
        patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
        examinerId: '00000000-0000-0000-0000-000000000000',
        locationId: 'location-Home-tamanu',
        plannedLocationId: null,
        departmentId: 'department-Cardiology-tamanu',
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
    },
    {
      id: '76b905b9-25aa-42aa-8888-19ae365f0d97',
      date: '2024-01-18 13:26:18',
      prescription: 'l,kl',
      note: '',
      indication: '',
      route: 'ear',
      qtyMorning: 0,
      qtyLunch: 0,
      qtyEvening: 0,
      qtyNight: 0,
      quantity: 0,
      discontinued: true,
      discontinuedDate: '2024-01-18',
      isDischarge: false,
      updatedAtSyncTick: '54178',
      createdAt: '2024-01-18T00:26:27.633Z',
      updatedAt: '2024-01-18T00:26:36.582Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      prescriberId: '1921ba8a-99db-4c46-aa94-1c2e3c38fde5',
      discontinuingClinicianId: '00000000-0000-0000-0000-000000000000',
      medicationId: 'drug-amoxicillin500',
      medication: {
        id: 'drug-amoxicillin500',
        code: 'amoxicillin500',
        type: 'drug',
        name: 'Amoxicillin 500mg Capsules',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:45.147Z',
        updatedAt: '2023-11-07T02:15:45.147Z',
        deletedAt: null,
      },
      encounter: {
        id: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
        encounterType: 'admission',
        startDate: '2024-01-18 13:25:40',
        endDate: '2024-01-18 13:26:40',
        reasonForEncounter: null,
        deviceId: null,
        plannedLocationStartTime: null,
        updatedAtSyncTick: '54178',
        createdAt: '2024-01-18T00:25:45.476Z',
        updatedAt: '2024-01-18T00:26:51.442Z',
        deletedAt: null,
        patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
        examinerId: '00000000-0000-0000-0000-000000000000',
        locationId: 'location-Home-tamanu',
        plannedLocationId: null,
        departmentId: 'department-Cardiology-tamanu',
        patientBillingTypeId: null,
        referralSourceId: null,
      },
      prescriber: {
        id: '1921ba8a-99db-4c46-aa94-1c2e3c38fde5',
        displayId: null,
        email: 'facility-a@tamanu.io',
        displayName: 'System: facility-a sync',
        role: 'admin',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:11:36.701Z',
        updatedAt: '2023-11-07T02:11:36.701Z',
        deletedAt: null,
      },
      discontinuingClinician: {
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
    },
    {
      id: '85d01000-64b4-4e1e-b380-22cb350c6772',
      date: '2024-01-19 12:26:42',
      prescription: 'fdasfdsa',
      note: '',
      indication: '',
      route: 'eye',
      qtyMorning: 0,
      qtyLunch: 0,
      qtyEvening: 0,
      qtyNight: 0,
      quantity: 0,
      isDischarge: false,
      updatedAtSyncTick: '55798',
      createdAt: '2024-01-18T23:26:52.070Z',
      updatedAt: '2024-01-18T23:26:52.070Z',
      encounterId: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
      prescriberId: '8cd88ce3-7a1e-4a4c-9ce8-5e57062ba396',
      medicationId: 'drug-aciclovir345',
      medication: {
        id: 'drug-aciclovir345',
        code: 'aciclovir345',
        type: 'drug',
        name: 'Aciclovir 3%w/w Eye Oint 4.5g',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-11-07T02:15:34.721Z',
        updatedAt: '2023-11-07T02:15:34.721Z',
        deletedAt: null,
      },
      encounter: {
        id: 'b93c70a2-510a-499d-acf6-08f94a4b9ebf',
        encounterType: 'admission',
        startDate: '2024-01-18 13:25:40',
        endDate: '2024-01-18 13:26:40',
        reasonForEncounter: null,
        deviceId: null,
        plannedLocationStartTime: null,
        updatedAtSyncTick: '54178',
        createdAt: '2024-01-18T00:25:45.476Z',
        updatedAt: '2024-01-18T00:26:51.442Z',
        deletedAt: null,
        patientId: '36534bf8-95b9-40e5-9808-f29e1e11bede',
        examinerId: '00000000-0000-0000-0000-000000000000',
        locationId: 'location-Home-tamanu',
        plannedLocationId: null,
        departmentId: 'department-Cardiology-tamanu',
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
    },
  ],
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

export const DischargeSummaryPrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component patientData={patient} encounter={encounter} getSetting={getSetting} />
    </PDFViewer>
  ),
};

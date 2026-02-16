import { MultipleImagingRequestsPrintout as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/ImagingRequestsPrintout',
  component: Component,
};

const getLocalisation = key => {
  const config = {};
  return config[key];
};

const encounter = {
  id: '76df3ccd-36c2-4f9f-a516-5d6e1bc9dd1e',
  encounterType: 'admission',
  startDate: '2023-12-05 15:00:18',
  updatedAtSyncTick: '34182',
  createdAt: '2023-12-05T02:00:23.260Z',
  updatedAt: '2023-12-05T02:00:23.260Z',
  patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
  examinerId: '8cd88ce3-7a1e-4a4c-9ce8-5e57062ba396',
  locationId: 'location-Home-tamanu',
  departmentId: 'department-GeneralMedicine-tamanu',
  department: {
    id: 'department-GeneralMedicine-tamanu',
    code: 'GeneralMedicine',
    name: 'General Medicine',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-11-07T02:15:47.345Z',
    updatedAt: '2023-11-07T02:15:47.345Z',
    facilityId: 'facility-1',
  },
  examiner: {
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
  diagnoses: [],
  procedures: [],
  medications: [],
};

const imagingRequests = [
  {
    id: 'b15053de-3ccd-4fbc-88ac-a8c0087cf7bd',
    displayId: 'XS66ZHW9',
    imagingType: '0',
    status: 'pending',
    requestedDate: '2024-01-15 16:46:11',
    legacyResults: '',
    priority: 'routine',
    updatedAtSyncTick: '55900',
    createdAt: '2024-01-15T19:46:18.835Z',
    updatedAt: '2024-01-15T19:46:18.835Z',
    encounterId: 'b17f5d5f-eca2-4daf-bb8c-ad455e789e9a',
    requestedById: 'de706b0c-dd51-4ecf-b01a-38bcaa27c0e1',
    requestedBy: {
      id: 'de706b0c-dd51-4ecf-b01a-38bcaa27c0e1',
      displayId: null,
      email: 'candace@hospital.com',
      displayName: 'Candace Eiland',
      role: 'practitioner',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-06-19T18:14:56.398Z',
      updatedAt: '2023-06-19T18:14:56.398Z',
      deletedAt: null,
    },
    areas: [],
    note: '',
    areaNote: '',
    notes: [],
  },
  {
    id: 'da624f70-38ba-42e4-b7d0-72009c05f998',
    displayId: 'ZQDZGU5N',
    imagingType: '0',
    status: 'pending',
    requestedDate: '2024-01-18 20:54:05',
    legacyResults: '',
    priority: 'urgent',
    updatedAtSyncTick: '60496',
    createdAt: '2024-01-18T23:54:25.932Z',
    updatedAt: '2024-01-18T23:54:25.932Z',
    encounterId: 'b17f5d5f-eca2-4daf-bb8c-ad455e789e9a',
    requestedById: '60cba8d8-89ba-4e09-a381-e889eeb12f6f',
    requestedBy: {
      id: '60cba8d8-89ba-4e09-a381-e889eeb12f6f',
      displayId: null,
      email: 'admin@hospital.com',
      displayName: 'Carolin Frazee',
      role: 'admin',
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-06-19T18:14:56.398Z',
      updatedAt: '2023-06-19T18:14:56.398Z',
      deletedAt: null,
    },
    areas: [],
    note: 'A note that was entered in by a clinician\nThis is meant to be on a new line.',
    areaNote: 'this is the area to be imaged note that is quite long.',
    notes: [
      {
        id: '9a8a7cce-2d52-4209-8d05-117620db9120',
        noteType: 'other',
        recordType: 'ImagingRequest',
        date: '2024-01-18 20:54:25',
        content: 'Line1\nLine2',
        visibilityStatus: 'current',
        updatedAtSyncTick: '60496',
        createdAt: '2024-01-18T23:54:25.940Z',
        updatedAt: '2024-01-18T23:54:25.940Z',
        recordId: 'da624f70-38ba-42e4-b7d0-72009c05f998',
        authorId: 'd02d54b1-bacb-4bbe-9350-48c3e46150c8',
      },
      {
        id: '0b1b6d80-7f6e-4dde-8d5f-aa033d7032e6',
        noteType: 'areaToBeImaged',
        recordType: 'ImagingRequest',
        date: '2024-01-18 20:54:25',
        content: 'This is the content of a note that is quite long.',
        visibilityStatus: 'current',
        updatedAtSyncTick: '60496',
        createdAt: '2024-01-18T23:54:25.943Z',
        updatedAt: '2024-01-18T23:54:25.943Z',
        recordId: 'da624f70-38ba-42e4-b7d0-72009c05f998',
        authorId: 'd02d54b1-bacb-4bbe-9350-48c3e46150c8',
      },
    ],
  },
];

const patient = {
  id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
  displayId: 'ZLTH247813',
  firstName: 'Roy',
  middleName: 'Ernest',
  lastName: 'Antonini',
  culturalName: 'Joe',
  dateOfBirth: '1981-10-27',
  dateOfDeath: null,
  sex: 'male',
  email: null,
  visibilityStatus: 'current',
  updatedAtSyncTick: '-999',
  createdAt: '2023-11-07T02:15:48.658Z',
  updatedAt: '2023-11-07T02:15:48.658Z',
  deletedAt: null,
  villageId: 'village-Nasaga',
  mergedIntoId: null,
  markedForSyncFacilities: [
    {
      id: 'facility-a',
      code: 'a',
      name: 'Facility A',
      email: null,
      contactNumber: null,
      streetAddress: null,
      cityTown: null,
      division: null,
      type: null,
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-11-07T02:11:36.545Z',
      updatedAt: '2023-11-07T02:11:36.545Z',
      deletedAt: null,
      PatientFacility: {
        id: '19324abf-b485-4184-8537-0a7fe4be1d0b;facility-a',
        patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        facilityId: 'facility-a',
        updatedAtSyncTick: '26',
        createdAt: '2023-11-07T02:18:25.970Z',
        updatedAt: '2023-11-07T02:18:25.970Z',
        deletedAt: null,
        PatientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        FacilityId: 'facility-a',
      },
    },
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
        id: '19324abf-b485-4184-8537-0a7fe4be1d0b;facility-1',
        patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        facilityId: 'facility-1',
        updatedAtSyncTick: '62',
        createdAt: '2023-11-07T02:36:36.306Z',
        updatedAt: '2023-11-07T02:36:36.306Z',
        deletedAt: null,
        PatientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
        FacilityId: 'facility-1',
      },
    },
  ],
  markedForSync: true,
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

export const ImagingRequestsPrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        patient={patient}
        imagingRequests={imagingRequests}
        encounter={encounter}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  ),
};

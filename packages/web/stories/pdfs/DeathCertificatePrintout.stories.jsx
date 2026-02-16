import { DeathCertificatePrintout as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/DeathCertificatePrintout',
  component: Component,
};

const getLocalisation = key => {
  const config = {};
  return config[key];
};
const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  printedBy: 'Admin',
  logo: Logo,
  watermark: Watermark,
};
const patientData = {
  loading: false,
  id: '352ac56c-6f06-4ea8-97d4-4aebb953de1f',
  error: null,
  issues: [],
  displayId: 'DHSY514119',
  firstName: 'Da danny daniel',
  middleName: 'Dev',
  lastName: '2023',
  culturalName: 'Tradi',
  dateOfBirth: '2022-12-31',
  dateOfDeath: '2024-01-22 12:38:02',
  sex: 'female',
  email: 'da@beyondessential.com.au',
  visibilityStatus: 'current',
  updatedAtSyncTick: '61480',
  createdAt: '2023-06-19T18:14:56.837Z',
  updatedAt: '2024-01-22T15:39:10.347Z',
  deletedAt: null,
  villageId: 'ref/village/AELE',
  mergedIntoId: null,
  markedForSyncFacilities: [
    {
      id: 'facility-ColonialWarMemorialDivisionalHospital',
      code: 'ColonialWarMemorialDivisionalHospital',
      name: 'Colonial War Memorial Divisional Hospital',
      email: null,
      contactNumber: null,
      streetAddress: null,
      cityTown: null,
      division: null,
      type: null,
      visibilityStatus: 'current',
      updatedAtSyncTick: '-999',
      createdAt: '2023-06-19T18:14:54.916Z',
      updatedAt: '2023-06-19T18:14:54.916Z',
      deletedAt: null,
      PatientFacility: {
        id: '352ac56c-6f06-4ea8-97d4-4aebb953de1f;facility-ColonialWarMemorialDivisionalHospital',
        patientId: '352ac56c-6f06-4ea8-97d4-4aebb953de1f',
        facilityId: 'facility-ColonialWarMemorialDivisionalHospital',
        updatedAtSyncTick: '1940',
        createdAt: null,
        updatedAt: null,
        deletedAt: null,
        PatientId: '352ac56c-6f06-4ea8-97d4-4aebb953de1f',
        FacilityId: 'facility-ColonialWarMemorialDivisionalHospital',
      },
    },
  ],
  markedForSync: true,
  patientId: '352ac56c-6f06-4ea8-97d4-4aebb953de1f',
  patientDeathDataId: '59b2190c-fa90-4875-a1c0-dff762cb3405',
  clinician: {
    id: '60cba8d8-89ba-4e09-a381-e889eeb12f6f',
    displayId: null,
    email: 'admin@hospital.com',
    displayName: 'Carolin Frazee',
    role: 'admin',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-06-19T18:14:56.398Z',
    updatedAt: '2023-06-19T18:14:56.398Z',
    deletedAt: null,
  },
  facility: {
    id: 'facility-BalevutoHealthCentre',
    code: 'BalevutoHealthCentre',
    name: 'Balevuto Health Centre',
    visibilityStatus: 'current',
    updatedAtSyncTick: '-999',
    createdAt: '2023-06-19T18:14:54.916Z',
    updatedAt: '2023-06-19T18:14:54.916Z',
  },
  outsideHealthFacility: false,
  isFinal: true,
  manner: 'Disease',
  causes: {
    primary: {
      condition: {
        id: 'diagnosis-H10-3',
        code: 'H10.3',
        type: 'diagnosis',
        name: 'Acute conjunctivitis',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-06-19T18:14:55.329Z',
        updatedAt: '2023-06-19T18:14:55.329Z',
      },
      timeAfterOnset: 10,
    },
    antecedent1: {
      condition: {
        id: 'diagnosis-H60-5',
        code: 'H60.5',
        type: 'diagnosis',
        name: 'Acute bacterial otitis externa',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-06-19T18:14:55.329Z',
        updatedAt: '2023-06-19T18:14:55.329Z',
      },
      timeAfterOnset: 10,
    },
    antecedent2: {
      condition: {
        id: 'ref/diagnosis/N41.0',
        code: 'N41.0',
        type: 'diagnosis',
        name: 'Acute bacterial prostatitis',
        visibilityStatus: 'current',
        updatedAtSyncTick: '-999',
        createdAt: '2023-06-19T18:14:55.329Z',
        updatedAt: '2023-06-19T18:14:55.329Z',
      },
      timeAfterOnset: 0,
    },
    contributing: [
      {
        id: '6d7b673f-c1a9-4b1e-80bd-c3a08c32d9f7',
        condition: {
          id: 'diagnosis-L03-0',
          code: 'L03.0',
          type: 'diagnosis',
          name: 'Acute bacterial paronychia',
          visibilityStatus: 'current',
          updatedAtSyncTick: '-999',
          createdAt: '2023-06-19T18:14:55.329Z',
          updatedAt: '2023-06-19T18:14:55.329Z',
        },
        timeAfterOnset: 5,
      },
      {
        id: 'e2e527a8-3f0a-4f79-a75c-b5c85ae2fa2f',
        condition: {
          id: 'diagnosis-I63-9',
          code: 'I63.9',
          type: 'diagnosis',
          name: 'Acute cerebral infarction',
          visibilityStatus: 'current',
          updatedAtSyncTick: '-999',
          createdAt: '2023-06-19T18:14:55.329Z',
          updatedAt: '2023-06-19T18:14:55.329Z',
        },
        timeAfterOnset: 0,
      },
    ],
    external: null,
  },
  recentSurgery: { date: '2024-01-22', reasonId: 'ref/diagnosis/H10.3' },
  pregnancy: null,
  fetalOrInfant: false,
};
export const DeathCertificatePrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        patientData={patientData}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  ),
};

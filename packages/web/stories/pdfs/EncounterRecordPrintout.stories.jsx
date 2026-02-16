import { EncounterRecordPrintout as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/EncounterRecordPrintout',
  component: Component,
};

const getLocalisation = key => {
  const config = {};
  return config[key];
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

const patientData = {
  id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
  displayId: 'ZLTH247813',
  firstName: 'Roy',
  middleName: 'Ernest',
  lastName: 'Antonini',
  culturalName: 'Joe',
  dateOfBirth: '1981-10-27',
  sex: 'male',
  email: null,
  villageId: 'village-Nasaga',
  additionalData: {
    id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
    patientId: '19324abf-b485-4184-8537-0a7fe4be1d0b',
    emergencyContactName: null,
    emergencyContactNumber: null,
    street_village: null,
    cityTown: null,
  },
};

const encounterData = {
  id: '2302e35e-6ec9-4e65-9f09-ab24bd835888',
  location: {
    facility: {
      id: '2302e35e-6ec9-4e65-9f09-ab24bd835888',
      name: 'Etta Clinic',
    },
  },
  examiner: {
    displayName: 'Jane Smith',
  },
  discharge: {
    discharger: {
      displayName: 'Jane Smith',
    },
  },
  reasonForEncounter: 'Presented at emergency department with chest pain',
  department: {
    name: 'Cardiology',
  },
  startDate: '2023-01-01 09:18:14',
  endDate: '2023-01-01 10:56:20',
};

const encounterTypesData = [
  {
    id: 'test',
    newEncounterType: 'triage',
    date: '2023-01-01 09:10:00',
  },
  {
    id: 'test-2',
    newEncounterType: 'admission',
    date: '2023-01-01 10:10:00',
  },
];

const locationsData = [
  {
    id: 'test',
    newLocationGroup: 'Ward 1',
    newLocation: 'Bed 1',
    date: '2023-01-01 09:10:00',
  },
  {
    id: 'test-2',
    newLocationGroup: 'Ward 2',
    newLocation: 'Bed 1',
    date: '2023-01-01 10:20:00',
  },
  {
    id: 'test-3',
    newLocationGroup: 'Ward 3',
    newLocation: 'Bed 1',
    date: '2023-01-01 10:20:00',
  },
];

const diagnosesData = [
  {
    id: 'test',
    isPrimary: true,
    date: '2023-01-01 10:20:00',
    diagnosis: {
      code: 'U07.1',
      name: 'Chlamydial lymphogranuloma vereneum',
    },
  },
  {
    id: 'test-2',
    isPrimary: false,
    date: '2023-01-01 10:20:00',
    diagnosis: {
      code: 'U07.1',
      name: 'Hypertension',
    },
  },
];

const proceduresData = [
  {
    id: 'test',
    date: '2023-01-01 10:20:00',
    procedureType: {
      code: 'U07.1',
      name: 'Lorem ipsum',
    },
  },
];

const labRequestsData = [
  {
    id: 'test',
    testType: 'COVID-19 Nasal Swab',
    testCategory: 'Lorum',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
    completedDate: '2023-01-01 10:20:00',
  },
  {
    id: 'test-2',
    testType: 'HCB',
    testCategory: 'FBC',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
  },
  {
    id: 'test-3',
    testType: 'PLT',
    testCategory: 'Serology',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
    completedDate: '2023-01-01 10:20:00',
  },
];

const medicationsData = [
  {
    id: 'test',
    medication: {
      name: 'Acetazolamide',
    },
    prescription: '1 tab po qid pc & hs',
    route: 'oral',
    prescriber: {
      displayName: 'Jane Doe',
    },
    date: '2023-01-01 10:20:00',
  },
  {
    id: 'test-2',
    medication: {
      name: 'Acetazolamide',
    },
    prescription: '1 tab po qid pc & hs',
    route: 'oral',
    prescriber: {
      displayName: 'Jane Doe',
    },
    date: '2023-01-01 10:20:00',
  },
  {
    id: 'test-3',
    medication: {
      name: 'Acetazolamide 250 mg Tablets',
    },
    prescription: '1 tab po qid pc & hs plus this other instruction',
    route: 'oral',
    prescriber: {
      displayName: 'Jane Doe',
    },
    date: '2023-01-01 10:20:00',
  },
];

// eslint-disable-next-line no-unused-vars
const imagingRequestsData = [];

const notesData = [
  {
    id: 'test',
    noteType: 'nursing',
    content:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea',
    author: {
      displayName: 'Dr Jim Wales',
    },
    date: '2023-01-01 10:20:00',
  },
];

export const EncounterRecordPrintout = () => (
  <PDFViewer width={800} height={1000} showToolbar={false}>
    <Component
      certificateData={certificateData}
      getLocalisation={getLocalisation}
      patientData={patientData}
      encounter={encounterData}
      encounterTypeHistory={encounterTypesData}
      locationHistory={locationsData}
      diagnoses={diagnosesData}
      procedures={proceduresData}
      labRequests={labRequestsData}
      medications={medicationsData}
      notes={notesData}
      imagingRequests={imagingRequestsData}
    />
  </PDFViewer>
);

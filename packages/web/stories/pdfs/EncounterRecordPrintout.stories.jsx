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
  const config = {
    'templates.letterhead.title': 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
    'templates.letterhead.subTitle': 'PO Box 12345, Melbourne, Australia',
    'templates.vaccineCertificate.emailAddress': 'tamanu@health.govt',
    'templates.vaccineCertificate.contactNumber': '123456',
    'fields.firstName.longLabel': 'First Name',
    'fields.lastName.longLabel': 'Last Name',
    'fields.dateOfBirth.longLabel': 'Date of Birth',
    'fields.sex.longLabel': 'Sex',
    'fields.clinician.shortLabel': 'Clinician',
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

// const LocalisedText
//
// const useLocalisedText = props => LocalisedText(props);

const certificateData = {
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
    newEncounterType: 'triage',
    date: '2023-01-01 09:10:00',
  },
  {
    newEncounterType: 'admission',
    date: '2023-01-01 10:10:00',
  },
];

const locationsData = [
  {
    newLocationGroup: 'Ward 1',
    newLocation: 'Bed 1',
    date: '2023-01-01 09:10:00',
  },
  {
    newLocationGroup: 'Ward 2',
    newLocation: 'Bed 1',
    date: '2023-01-01 10:20:00',
  },
  {
    newLocationGroup: 'Ward 3',
    newLocation: 'Bed 1',
    date: '2023-01-01 10:20:00',
  },
];

const diagnosesData = [
  {
    isPrimary: true,
    date: '2023-01-01 10:20:00',
    diagnosis: {
      code: 'U07.1',
      name: 'Chlamydial lymphogranuloma vereneum',
    },
  },
  {
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
    date: '2023-01-01 10:20:00',
    procedureType: {
      code: 'U07.1',
      name: 'Lorem ipsum',
    },
  },
];

const labRequestsData = [
  {
    testType: 'COVID-19 Nasal Swab',
    testCategory: 'Lorum',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
    completedDate: '2023-01-01 10:20:00',
  },
  {
    testType: 'HCB',
    testCategory: 'FBC',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
  },
  {
    testType: 'PLT',
    testCategory: 'Serology',
    requestedByName: 'Jane Doe',
    requestDate: '2023-01-01 10:20:00',
    completedDate: '2023-01-01 10:20:00',
  },
];

export const EncounterRecordPrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        getLocalisation={getLocalisation}
        patient={patientData}
        encounter={encounterData}
        encounterTypeHistory={encounterTypesData}
        locationHistory={locationsData}
        diagnoses={diagnosesData}
        procedures={proceduresData}
        labRequests={labRequestsData}
      />
    </PDFViewer>
  ),
};

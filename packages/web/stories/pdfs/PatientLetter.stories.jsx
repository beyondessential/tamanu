import React from 'react';
import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/database/demoData';
import { PDFViewer } from '@react-pdf/renderer';
import { PatientLetter as Component } from '@tamanu/shared/utils/patientLetters/PatientLetter';
import { getCurrentDateTimeString } from '@tamanu/utils/dateTime';
import Logo from '../assets/tamanu-logo.png';

export default {
  title: 'pdfs/PatientLetter',
  component: Component,
};

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
};

const getLocalisation = key => {
  const config = {};
  return config[key];
};

const examiner = {
  id: '6b1269ff-2443-4381-a532-ddd48fbd5020',
  email: 'admin@tamanu.io',
  displayName: 'Initial Admin',
  role: 'admin',
  createdAt: '2022-01-20T22:48:47.375Z',
  updatedAt: '2022-02-21T01:02:40.347Z',
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
};

export const PatientLetter = () => {
  const patientLetterData = {
    title: 'Sick note',
    patient,
    clinician: examiner,
    documentCreatedAt: getCurrentDateTimeString(),
    body:
      'This is a sick note!\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  };

  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        logoSrc={Logo}
        getLocalisation={getLocalisation}
        letterheadConfig={certificateData}
        data={patientLetterData}
      />
    </PDFViewer>
  );
};

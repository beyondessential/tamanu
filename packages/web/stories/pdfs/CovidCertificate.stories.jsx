import React from 'react';
import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/database/demoData';
import { CovidLabCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import { PDFViewer } from '@react-pdf/renderer';
import SigningImage from '../assets/signing-image.png';
import Watermark from '../assets/watermark.png';
import Logo from '../assets/tamanu-logo.png';

export default {
  title: 'pdfs/CovidLabCertificate',
  component: Component,
};

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
};

const labs = [
  {
    sampleTime: '2022-01-26T21:30:46.960Z',
    requestedDate: '2022-01-26T21:30:46.960Z',
    status: 'published',
    displayId: 'TESTID',
    laboratory: {
      name: 'Test Lab 1',
    },
    tests: {
      date: '2022-01-26T21:59:04.885Z',
      status: 'reception_pending',
      result: 'Positive',
      laboratoryOfficer: null,
      completedDate: '2022-01-26T21:59:04.885Z',
      labTestMethod: {
        name: 'Lab Test Method',
      },
    },
  },
  {
    sampleTime: '2022-01-26T21:30:46.960Z',
    requestedDate: '2022-01-26T21:30:46.960Z',
    status: 'published',
    displayId: 'TESTID',
    laboratory: {
      name: 'Test Lab 2',
    },
    tests: {
      date: '2022-01-26T21:59:04.881Z',
      status: 'reception_pending',
      result: 'Positive',
      laboratoryOfficer: null,
      completedDate: '2022-01-26T21:59:04.881Z',
      labTestMethod: {
        name: 'Lab Test Method',
      },
    },
  },
];

const getLocalisation = key => {
  const config = {
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const getSetting = key => {
  const config = {
    'templates.letterhead.title': 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
    'templates.letterhead.subTitle': 'PO Box 12345, Melbourne, Australia',
  };
  return config[key];
};

export const CovidLabCertificate = () => {
  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        patient={patient}
        createdBy="Initial Admin"
        labs={labs}
        watermarkSrc={Watermark}
        signingSrc={SigningImage}
        logoSrc={Logo}
        getLocalisation={getLocalisation}
        getSetting={getSetting}
        printedBy="Initial Admin"
      />
    </PDFViewer>
  );
};

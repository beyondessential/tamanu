import React from 'react';
import QRCode from 'qrcode';
import { storiesOf } from '@storybook/react';
import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData';
import { CovidCertificate } from 'shared/utils';
import { PDFViewer } from '@react-pdf/renderer';
import SigningImage from './assets/signing-image.png';
import Watermark from './assets/watermark.png';

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

storiesOf('Certificates', module).add('CovidCertificate', () => {
  const vds = () => QRCode.toDataURL('Testing');
  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <CovidCertificate
        patient={patient}
        labs={labs}
        watermarkSrc={Watermark}
        signingSrc={SigningImage}
        vdsSrc={vds}
      />
    </PDFViewer>
  );
});

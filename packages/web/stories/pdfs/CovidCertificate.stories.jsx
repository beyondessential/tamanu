import React from 'react';
import QRCode from 'qrcode';
import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/shared/demoData';
import { CovidLabCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import { PDFViewer } from '@react-pdf/renderer';
import { PatientLetter } from '@tamanu/shared/utils/patientLetters/PatientLetter';
import { getCurrentDateTimeString } from '@tamanu/shared/utils/dateTime';
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

const vdsData = {
  hdr: { is: 'UTO', t: 'icao.vacc', v: 1 },
  msg: { uvci: '4ag7mhr81u90', vaxx: 'data' },
  sig: {
    alg: 'ES256',
    cer:
      'MIIBfzCCASSgAwIBAgICA-kwCgYIKoZIzj0EAwIwGzEZMAkGA1UEBhMCVVQwDAYDVQQDDAVVVCBDQTAeFw0yMjAyMjgwNDM4NTlaFw0yMjA2MDEwNTM4NTlaMBgxFjAJBgNVBAYTAlVUMAkGA1UEAxMCVEEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQYoJ0WkOC60kG1xS7tGqVGNTmsoURKr2NWzMh6HZv3Zl5nq97-sD8q9_6JM-SyLmDh4b1g_t98aD-L3v5RTlIHo1swWTAnBgNVHSMBAf8EHTAbgBQBov7Y-IocFwj1UlYXU6buFiz3A6EAggEBMBoGB2eBCAEBBgIEDzANAgEAMQgTAk5UEwJOVjASBgNVHSUECzAJBgdngQgBAQ4CMAoGCCqGSM49BAMCA0kAMEYCIQD4qnBz7amUmmg0AgfdlqT0ItnsZ_X8cPYJRqZuBaZG5AIhAKUqdrxDYTKIbZ01ZTFaXGJFXXxaHr5DmuWWoeaUEYkO',
    sigvl:
      'MEUCID6xG4DJpb3wQyHSRwTCVBdUP5YA4noGkTtinl4sSDO6AiEAhQfb36wrFDhVh6uFLph2siKJtothMIz0DebzZIR7nZU',
  },
};

const vds = () => QRCode.toDataURL(vdsData);

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
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const vdsSrc = () => QRCode.toDataURL(vdsData);

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
        vdsSrc={vdsSrc}
        getLocalisation={getLocalisation}
        printedBy="Initial Admin"
      />
    </PDFViewer>
  );
};

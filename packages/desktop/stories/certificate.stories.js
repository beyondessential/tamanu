import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { storiesOf } from '@storybook/react';
import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData';
import { CovidLabCertificate, VaccineCertificate } from 'shared/utils/patientCertificates';
import { PDFViewer } from '@react-pdf/renderer';
import { DeathCertificate } from '../app/components/PatientPrinting/printouts/DeathCertificate';
import SigningImage from './assets/signing-image.png';
import Watermark from './assets/watermark.png';
import Logo from './assets/tamanu-logo.png';
import { Modal } from '../app/components';

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

const certificateData = {
  title: 'Tamanu Ministry of Health & Medical Services',
  subTitle: 'PS Box 123456, Melbourne, Australia',
  logo: Logo,
  logoType: 'image/png',
  watermark: Watermark,
  watermarkType: 'image/png',
  footerImg: SigningImage,
  footerImgType: 'image/png',
  printedBy: 'Initial Admin',
};

storiesOf('Certificates', module).add('DeathCertificate', () => {
  return (
    <Modal title="Record patient death" open width="md">
      <DeathCertificate
        patientData={{
          ...patient,
          timeOfDeath: new Date(),
          causes: {
            primary: { condition: { name: 'Diabetes' } },
            antecedent1: { condition: { name: 'Eating too much sugar' } },
            antecedent2: { condition: { name: 'Living in a nutritionally poor environment' } },
            contributing: [
              { condition: { name: 'Old age' } },
              { condition: { name: 'Overweight' } },
              { condition: { name: 'Smoking' } },
            ],
          },
        }}
        certificateData={certificateData}
      />
    </Modal>
  );
});

storiesOf('Certificates', module).add('CovidLabCertificate', () => (
  <PDFViewer width={800} height={1000} showToolbar={false}>
    <CovidLabCertificate
      patient={patient}
      createdBy="Initial Admin"
      labs={labs}
      watermarkSrc={Watermark}
      signingSrc={SigningImage}
      logoSrc={Logo}
      vdsSrc={vds}
      getLocalisation={getLocalisation}
      printedBy="Initial Admin"
    />
  </PDFViewer>
));

const vaccinations = [
  {
    id: '2f27fd7a-e954-4d28-82e9-f64d7b0b5978',
    batch: '123',
    status: 'GIVEN',
    injectionSite: 'Left arm',
    date: '2022-02-21T01:05:14.118Z',
    createdAt: '2022-02-21T01:05:29.498Z',
    updatedAt: '2022-02-21T01:06:00.461Z',
    encounterId: 'e498c326-850b-4d14-8716-0e742d5fb379',
    scheduledVaccineId: 'e5813cff-51d2-4ae8-a30e-3c60332880db',
    encounter: {
      id: 'e498c326-850b-4d14-8716-0e742d5fb379',
      encounterType: 'admission',
      startDate: '2022-02-03T02:03:04.750Z',
      endDate: null,
      reasonForEncounter: null,
      deviceId: null,
      createdAt: '2022-02-03T02:03:21.849Z',
      updatedAt: '2022-02-21T01:06:00.456Z',
      patientId: 'e0f2557f-254f-4d52-8376-39f2fcacfe52',
      examinerId: '6b1269ff-2443-4381-a532-ddd48fbd5020',
      locationId: 'location-ClinicalTreatmentRoom',
      departmentId: 'ref/department/ANTENATAL',
      vitals: [],
      department: {
        id: 'ref/department/ANTENATAL',
        code: 'ANTENATAL',
        name: 'Antenatal',
        createdAt: '2022-01-20T22:51:24.384Z',
        updatedAt: '2022-01-23T21:54:25.135Z',
        facilityId: 'ref/facility/ba',
      },
      location: {
        id: 'location-ClinicalTreatmentRoom',
        code: 'ClinicalTreatmentRoom',
        name: 'Clinical Treatment Room',
        createdAt: '2022-01-20T22:51:24.738Z',
        updatedAt: '2022-01-23T21:56:27.340Z',
      },
      examiner: {
        id: '6b1269ff-2443-4381-a532-ddd48fbd5020',
        email: 'admin@tamanu.io',
        displayName: 'Initial Admin',
        role: 'admin',
        createdAt: '2022-01-20T22:48:47.375Z',
        updatedAt: '2022-02-21T01:02:40.347Z',
      },
    },
    scheduledVaccine: {
      id: 'e5813cff-51d2-4ae8-a30e-3c60332880db',
      category: 'Campaign',
      label: 'COVID-19 Pfizer',
      schedule: 'Dose 1',
      weeksFromBirthDue: null,
      weeksFromLastVaccinationDue: null,
      index: 1,
      createdAt: '2022-01-20T22:51:25.251Z',
      updatedAt: '2022-01-23T21:56:27.437Z',
      vaccineId: 'drug-COVID-19-Pfizer',
    },
    certifiable: true,
  },
];

storiesOf('Certificates', module).add('VaccineCertificate', () => {
  const [vdsSrc, setVdsSrc] = useState();

  useEffect(() => {
    (async () => {
      const src = await QRCode.toDataURL(JSON.stringify(vdsData));
      setVdsSrc(src);
    })();
  }, []);

  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <VaccineCertificate
        patient={patient}
        vaccinations={vaccinations}
        watermarkSrc={Watermark}
        signingSrc={SigningImage}
        logoSrc={Logo}
        vdsSrc={vdsSrc}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  );
});

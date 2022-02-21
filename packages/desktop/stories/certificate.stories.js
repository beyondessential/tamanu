import React from 'react';
import QRCode from 'qrcode';
import { storiesOf } from '@storybook/react';
import { createDummyPatient, createDummyPatientAdditionalData } from 'shared/demoData';
import { CovidCertificate, VaccineCertificate } from 'shared/utils';
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

const vaxPatient = {
  loading: false,
  id: 'e0f2557f-254f-4d52-8376-39f2fcacfe52',
  error: null,
  issues: [],
  currentEncounter: {
    id: 'e498c326-850b-4d14-8716-0e742d5fb379',
    encounterType: 'admission',
    startDate: '2022-02-03T02:03:04.750Z',
    markedForPush: true,
    isPushing: false,
    pushedAt: '2022-02-03T02:04:00.357Z',
    pulledAt: '2022-02-03T02:04:00.447Z',
    createdAt: '2022-02-03T02:03:21.849Z',
    updatedAt: '2022-02-21T01:05:29.502Z',
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
  conditions: [],
  allergies: [],
  familyHistory: [],
  displayId: 'CWNT188702',
  firstName: 'Rosanna',
  middleName: 'Lenora',
  lastName: 'Adam',
  culturalName: 'Wessie',
  dateOfBirth: '2003-02-18T05:04:06.302Z',
  sex: 'female',
  createdAt: '2022-01-20T22:51:35.720Z',
  updatedAt: '2022-02-15T03:17:00.186Z',
  villageId: 'ref/village/AELE',
  carePlans: [],
  additionalData: {
    id: 'ac1f4b92-5cff-46df-a09c-508ac9f82414',
    emergencyContactName: '',
    emergencyContactNumber: '',
    markedForPush: false,
    isPushing: false,
    pushedAt: '2022-01-24T01:11:00.261Z',
    pulledAt: '2022-01-24T01:11:00.281Z',
    createdAt: '2022-01-24T01:10:05.185Z',
    updatedAt: '2022-01-24T01:11:00.281Z',
    patientId: 'e0f2557f-254f-4d52-8376-39f2fcacfe52',
    nationalityId: 'nationality-Palau',
  },
  email: null,
  markedForSync: true,
  markedForPush: false,
  isPushing: false,
  pushedAt: '2022-02-15T03:17:00.169Z',
  pulledAt: '2022-02-15T03:17:00.186Z',
  syncing: false,
  dateOfDeath: null,
};

const immunisations = [
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
      markedForPush: false,
      isPushing: false,
      pushedAt: '2022-02-21T01:06:00.372Z',
      pulledAt: '2022-02-21T01:06:00.455Z',
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
  },
];

storiesOf('Certificates', module).add('VaccineCertificate', () => {
  const vds = () => QRCode.toDataURL('Testing');
  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <VaccineCertificate
        patient={vaxPatient}
        immunisations={immunisations}
        watermarkSrc={Watermark}
        signingSrc={SigningImage}
        vdsSrc={vds}
      />
    </PDFViewer>
  );
});

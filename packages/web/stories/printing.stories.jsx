import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';
import {
  VaccineCertificate,
  BirthNotificationCertificate,
} from '@tamanu/shared/utils/patientCertificates';
import Logo from './assets/tamanu-logo.png';
import Watermark from './assets/watermark.png';
import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/shared/demoData';

export default {
  VaccineCertificate,
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
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
};

const examiner = {
  id: '6b1269ff-2443-4381-a532-ddd48fbd5020',
  email: 'admin@tamanu.io',
  displayName: 'Initial Admin',
  role: 'admin',
  createdAt: '2022-01-20T22:48:47.375Z',
  updatedAt: '2022-02-21T01:02:40.347Z',
};

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
      examiner,
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

const motherData = {
  id: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
  displayId: 'VPZQ171731',
  firstName: 'Jake',
  middleName: 'The',
  lastName: '1Muss',
  culturalName: null,
  dateOfBirth: '2023-01-06',
  dateOfDeath: null,
  sex: 'male',
  email: null,
  visibilityStatus: 'current',
  updatedAtSyncTick: '434113',
  createdAt: '2023-01-12T21:02:26.370Z',
  updatedAt: '2023-03-26T22:20:12.379Z',
  deletedAt: null,
  villageId: null,
  mergedIntoId: null,
  markedForSyncFacilities: [
    {
      id: 'ref/facility/ba',
      code: 'ba',
      name: 'Ba Health Centre - 1',
      email: null,
      contactNumber: null,
      streetAddress: null,
      cityTown: null,
      division: '',
      type: '',
      visibilityStatus: 'current',
      updatedAtSyncTick: '0',
      createdAt: '2023-01-12T21:02:20.377Z',
      updatedAt: '2023-01-12T21:02:20.377Z',
      deletedAt: null,
      PatientFacility: {
        id: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4;ref/facility/ba',
        patientId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
        facilityId: 'ref/facility/ba',
        updatedAtSyncTick: '434093',
        createdAt: '2023-03-26T22:18:42.145Z',
        updatedAt: '2023-03-26T22:18:42.145Z',
        deletedAt: null,
        PatientId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
        FacilityId: 'ref/facility/ba',
      },
    },
  ],
  markedForSync: true,
  additionalData: {
    id: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    patientId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    emergencyContactName: '',
    emergencyContactNumber: '',
    updatedAtByField: {
      patient_id: 434113,
      emergency_contact_name: 434113,
      emergency_contact_number: 434113,
    },
    updatedAtSyncTick: '434113',
    createdAt: '2023-03-26T22:20:12.394Z',
    updatedAt: '2023-03-26T22:20:12.394Z',
    streetVillage: null,
    cityTown: null,
  },
  village: null,
  occupation: null,
  ethnicity: null,
  mother: null,
  father: null,
};

const fatherData = {
  id: '2e0e649a-f1c3-4848-8751-0a41a232dd11B',
  displayId: 'BPSW678252B',
  firstName: 'Mike',
  middleName: null,
  lastName: 'Adam',
  culturalName: null,
  dateOfBirth: '1990-09-09',
  dateOfDeath: null,
  sex: 'female',
  email: 'michael@beyondessential.com.au',
  visibilityStatus: 'current',
  updatedAtSyncTick: '0',
  createdAt: '2023-01-12T21:02:26.370Z',
  updatedAt: '2023-01-12T21:02:26.370Z',
  deletedAt: null,
  villageId: null,
  mergedIntoId: null,
  markedForSyncFacilities: [],
  markedForSync: false,
  additionalData: { streetVillage: null, cityTown: null },
  village: null,
  occupation: null,
  ethnicity: null,
  mother: null,
  father: null,
};

const childData = {
  loading: false,
  id: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
  error: null,
  issues: [],
  displayId: 'DGLG127444',
  firstName: 'Mickey Minie',
  middleName: null,
  lastName: '1Mouse',
  culturalName: null,
  dateOfBirth: '2004-02-26',
  dateOfDeath: null,
  sex: 'male',
  email: null,
  visibilityStatus: 'current',
  updatedAtSyncTick: '429851',
  createdAt: '2023-01-12T21:02:26.370Z',
  updatedAt: '2023-03-16T02:25:06.143Z',
  deletedAt: null,
  villageId: null,
  mergedIntoId: null,
  markedForSyncFacilities: [
    {
      id: 'ref/facility/ba',
      code: 'ba',
      name: 'Ba Health Centre - 1',
      email: null,
      contactNumber: null,
      streetAddress: null,
      cityTown: null,
      division: '',
      type: '',
      visibilityStatus: 'current',
      updatedAtSyncTick: '0',
      createdAt: '2023-01-12T21:02:20.377Z',
      updatedAt: '2023-01-12T21:02:20.377Z',
      deletedAt: null,
      PatientFacility: {
        id: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a;ref/facility/ba',
        patientId: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
        facilityId: 'ref/facility/ba',
        updatedAtSyncTick: '407797',
        createdAt: '2023-02-16T02:37:10.615Z',
        updatedAt: '2023-02-16T02:37:10.615Z',
        deletedAt: null,
        PatientId: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
        FacilityId: 'ref/facility/ba',
      },
    },
  ],
  markedForSync: true,
  birthData: {},
  additionalData: {
    id: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
    patientId: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
    emergencyContactName: '',
    emergencyContactNumber: '',
    motherId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    fatherId: '2e0e649a-f1c3-4848-8751-0a41a232dd11B',
    updatedAtByField: {
      father_id: 439367,
      mother_id: 439367,
      patient_id: 409837,
      emergency_contact_name: 409837,
      emergency_contact_number: 409837,
    },
    updatedAtSyncTick: '439367',
    createdAt: '2023-02-19T22:11:25.513Z',
    updatedAt: '2024-01-11T02:16:10.882Z',
    streetVillage: null,
    cityTown: null,
  },
  ethnicity: null,
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

export const BirthNotification = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <BirthNotificationCertificate
        certificateData={certificateData}
        motherData={motherData}
        fatherData={fatherData}
        childData={childData}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  ),
};

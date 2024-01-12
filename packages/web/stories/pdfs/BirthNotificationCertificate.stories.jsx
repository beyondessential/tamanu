import { BirthNotificationCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/BirthNotificationCertificate',
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
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

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
  printDate: new Date(),
};

export const BirthNotificationCertificate = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        motherData={motherData}
        fatherData={fatherData}
        childData={childData}
        getLocalisation={getLocalisation}
      />
    </PDFViewer>
  ),
};

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
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const certificateData = {
  logo: Logo,
  // watermark: Watermark,
};

const patientData = {
  id: '19324abf-b485-4184-8537-0a7fe4be1d0b',
  displayId: 'ZLTH247813',
  firstName: 'Roy',
  middleName: 'Ernest',
  lastName: 'Antonini',
  culturalName: 'Joe',
  dateOfbirth: '1981-10-27',
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

const encounterData = {};

export const EncounterRecordPrintout = {
  render: () => (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        certificateData={certificateData}
        getLocalisation={getLocalisation}
        patient={patientData}
      />
    </PDFViewer>
  ),
};

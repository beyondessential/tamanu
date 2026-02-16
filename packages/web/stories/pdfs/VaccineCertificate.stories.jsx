import React from 'react';
import { createDummyPatient, createDummyPatientAdditionalData } from '@tamanu/database/demoData';
import { VaccineCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import { PDFViewer } from '@react-pdf/renderer';
import SigningImage from '../assets/signing-image.png';
import Watermark from '../assets/watermark.png';
import Logo from '../assets/tamanu-logo.png';

export default {
  title: 'pdfs/VaccineCertificate',
  component: Component,
};

const dummyPatient = createDummyPatient();
const dummyAdditionalData = createDummyPatientAdditionalData();

const patient = {
  ...dummyPatient,
  ...dummyAdditionalData,
};

const localisation = {
  previewUvciFormat: 'tamanu',
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

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
};

const healthFacility = 'State level';

export const VaccineCertificate = () => {
  return (
    <PDFViewer width={800} height={1000} showToolbar={false}>
      <Component
        patient={patient}
        vaccinations={vaccinations}
        watermarkSrc={Watermark}
        signingSrc={SigningImage}
        logoSrc={Logo}
        localisation={localisation}
        certificateData={certificateData}
        healthFacility={healthFacility}
      />
    </PDFViewer>
  );
};

import { BirthNotificationCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-blue-long.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/BirthNotificationCertificate',
  component: Component,
};

const getLocalisation = key => {
  const config = {
    previewUvciFormat: 'tamanu',
  };
  return config[key];
};

const motherData = {
  id: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
  displayId: 'VPZQ171731',
  firstName: 'Jane',
  middleName: null,
  lastName: 'Doe',
  culturalName: null,
  dateOfBirth: '1990-01-06',
  dateOfDeath: null,
  sex: 'female',
  email: null,
  villageId: null,
  additionalData: {
    id: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    patientId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    emergencyContactName: '',
    emergencyContactNumber: '',
    streetVillage: null,
    cityTown: null,
  },
  village: null,
  occupation: 'Lawyer',
  ethnicity: 'Fijian',
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
  villageId: null,
  mergedIntoId: null,
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
  firstName: 'Mickey',
  middleName: null,
  lastName: 'Mouse',
  culturalName: null,
  dateOfBirth: '2004-02-26',
  dateOfDeath: null,
  sex: 'male',
  email: null,
  villageId: null,
  mergedIntoId: null,
  birthData: {
    gestationalAgeEstimate: 37,
    birthDeliveryType: 'normal',
    birthType: 'single',
    birthWeight: 2.6,
    dateOfBirth: null,
    timeOfBirth: null,
  },
  additionalData: {
    id: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
    patientId: 'fb609515-9bd9-4ee5-a0ec-abac68ae099a',
    emergencyContactName: '',
    emergencyContactNumber: '',
    motherId: '51e7e152-7ad9-4c2e-a7f5-6472f1af7fd4',
    fatherId: '2e0e649a-f1c3-4848-8751-0a41a232dd11B',
    streetVillage: null,
    cityTown: null,
  },
  ethnicity: 'Fijian',
};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
};

const facility = {
  name: 'Etta Clinic',
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
        facility={facility}
      />
    </PDFViewer>
  ),
};

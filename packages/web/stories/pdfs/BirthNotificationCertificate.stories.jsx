import { BirthNotificationCertificate as Component } from '@tamanu/shared/utils/patientCertificates';
import Logo from '../assets/tamanu-logo.png';
import { PDFViewer } from '@react-pdf/renderer';
import React from 'react';
import Watermark from '../assets/watermark.png';

export default {
  title: 'pdfs/BirthNotificationCertificate',
  component: Component,
};

const getLocalisation = () => {};

const motherData = {};

const fatherData = {};

const childData = {};

const certificateData = {
  title: 'TAMANU MINISTRY OF HEALTH & MEDICAL SERVICES',
  subTitle: 'PO Box 12345, Melbourne, Australia',
  logo: Logo,
  watermark: Watermark,
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

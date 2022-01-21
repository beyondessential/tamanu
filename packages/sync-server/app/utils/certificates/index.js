import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { CovidCertificate } from './CovidCertificate';

export const makeCertificate = data => {
  const rootElemComponent = React.createElement(CovidCertificate, data);
  return ReactPDF.render(<CovidCertificate patient={data} />, `./certificate.pdf`);
};

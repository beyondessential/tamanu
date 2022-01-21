import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { CovidCertificate } from './CovidCertificate';

export const makeCertificate = data => {
  return ReactPDF.render(<CovidCertificate patient={data} />, `./certificate.pdf`);
};

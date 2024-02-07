import { createElement } from 'react';

export const renderPDF = async props => {
  const { pdf } = await import('@react-pdf/renderer');
  const { VaccineCertificate } = await import('@tamanu/shared/utils/patientCertificates');
  return pdf(createElement(VaccineCertificate, props)).toBlob();
};

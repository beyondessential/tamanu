import { createElement } from 'react';
import { pdf } from '@react-pdf/renderer';
import { VaccineCertificate } from '@tamanu/shared/utils/patientCertificates';

const idToComponent = {
  'vaccine-certificate': VaccineCertificate,
};

export const renderPDF = async ({ id, ...props }) => {
  const component = idToComponent[id];
  return pdf(createElement(component, props)).toBlob();
};

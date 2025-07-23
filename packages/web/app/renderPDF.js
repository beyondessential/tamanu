import { createElement } from 'react';

const idToComponent = {
  'vaccine-certificate': async () => {
    const { VaccineCertificate } = await import(
      '@tamanu/shared/utils/patientCertificates/VaccineCertificate'
    );
    return VaccineCertificate;
  },
  'encounter-record': async () => {
    const { EncounterRecordPrintout } = await import(
      '@tamanu/shared/utils/patientCertificates/EncounterRecordPrintout'
    );
    return EncounterRecordPrintout;
  },
};

export const renderPDF = async ({ id, ...props }) => {
  const { pdf } = await import('@react-pdf/renderer');
  const component = await idToComponent[id]();
  return pdf(createElement(component, props)).toBlob();
};

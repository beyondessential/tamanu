import { createElement } from 'react';

export const renderPDF = async props => {
  const { pdf } = await import('@react-pdf/renderer');
  const { PDF } = await import('./utils/PDF');
  return pdf(createElement(PDF, props)).toBlob();
};

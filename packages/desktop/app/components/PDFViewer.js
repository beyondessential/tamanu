import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';

const IFRAME_ID = 'frameId';

export const PDFViewer = ({ children }) => {
  const [instance, updateInstance] = usePDF({ document: children });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, children]);

  return (
    <iframe
      src={`${instance.url}#toolbar=0`}
      title="tamanu-pdf-document"
      id={IFRAME_ID}
      width={790}
      height={1000}
    />
  );
};

export const printPDF = () => {
  const iframe = document.getElementById(IFRAME_ID);
  iframe.contentWindow.print();
};

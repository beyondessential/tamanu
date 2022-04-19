import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';

export const PDFViewer = ({ children }) => {
  const [instance, updateInstance] = usePDF({ document: children });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, children]);

  return (
    <iframe
      src={`${instance.url}#toolbar=0`}
      title="vaccine-certificate"
      id="frameId"
      width={800}
      height={1000}
    />
  );
};

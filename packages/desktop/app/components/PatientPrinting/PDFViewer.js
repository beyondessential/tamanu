import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';

// @react-pdf/renderer ships with it's own version of PDFViewer. However it is a bit flaky because
// it doesn't include updateInstance in the useEffect dependencies. Also it is convenient to set
// width, height and toolbar settings in one place
export const PDFViewer = ({ id, children, props }) => {
  const [instance, updateInstance] = usePDF({ document: children });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, children]);

  return (
    <iframe
      src={`${instance.url}#toolbar=0`}
      title={id}
      id={id}
      width={780}
      height={1000}
      {...props}
    />
  );
};

export const printPDF = elementId => {
  const iframe = document.getElementById(elementId);
  iframe.contentWindow.print();
};

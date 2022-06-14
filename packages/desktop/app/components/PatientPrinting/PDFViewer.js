import React, { useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import styled from 'styled-components';

const FullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 50vh;
`;

// @react-pdf/renderer ships with its own version of PDFViewer. However it is a bit flaky because
// it doesn't include updateInstance in the useEffect dependencies. Also it is convenient to set
// width, height and toolbar settings in one place
export const PDFViewer = ({ id, children, props }) => {
  const [instance, updateInstance] = usePDF({ document: children });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, children]);

  if (!instance.url) return null;

  return <FullIframe src={`${instance.url}#toolbar=0`} title={id} id={id} {...props} />;
};

export const printPDF = elementId => {
  const iframe = document.getElementById(elementId);
  iframe.contentWindow.print();
};

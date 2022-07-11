import React, { useState, useEffect } from 'react';
import { usePDF } from '@react-pdf/renderer';
import { CircularProgress, Typography } from '@material-ui/core';
import styled from 'styled-components';

const FullIframe = styled.iframe`
  width: 100%;
  height: 100%;
  min-height: 50vh;
`;

const Loader = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 50vh;

  .MuiTypography-root {
    margin-top: 40px;
    font-size: 16px;
    color: ${props => props.theme.palette.text.secondary};
  }
`;

// @react-pdf/renderer ships with its own version of PDFViewer. However it is a bit flaky because
// it doesn't include updateInstance in the useEffect dependencies. Also it is convenient to set
// width, height and toolbar settings in one place
export const PDFViewer = ({ id, children }) => {
  const [loaded, setLoaded] = useState(false);
  const [instance, updateInstance] = usePDF({ document: children });

  useEffect(() => {
    updateInstance();
  }, [updateInstance, children, id, loaded]);

  useEffect(() => {
    setTimeout(() => {
      // Delay loading to stop flicker
      setLoaded(true);
    }, 2000);
  });

  if (!instance.url || !loaded) {
    return (
      <Loader>
        <CircularProgress size="5rem" />
        <Typography>Loading...</Typography>
      </Loader>
    );
  }

  return <FullIframe src={`${instance.url}#toolbar=0`} title={id} id={id} key={id} />;
};

export const printPDF = elementId => {
  const iframe = document.getElementById(elementId);
  iframe.contentWindow.print();
};

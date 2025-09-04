import React from 'react';
import { usePDF } from '@react-pdf/renderer';
import { Box, CircularProgress, Typography } from '@mui/material';
import styled from 'styled-components';
import { TranslatedText } from '../Translation';

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

const LoadingIndicator = () => (
  <Loader data-testid="loader-h17a">
    <CircularProgress size="5rem" data-testid="circularprogress-o1ud" />
    <Typography data-testid="typography-nd30">
      <TranslatedText
        stringId="general.status.loading"
        fallback="Loading…"
        data-testid="translatedtext-0lyw"
      />
    </Typography>
  </Loader>
);

const ErrorDisplay = () => (
  <Box p={5} my={5} data-testid="box-yzbm">
    <Typography variant="h5" gutterBottom data-testid="typography-wc5n">
      Error
    </Typography>
    <Typography data-testid="typography-3y8l">
      Error loading document. Please try logging in again to view the document.
    </Typography>
  </Box>
);

export const PDFLoader = React.memo(({ id, children, isLoading = false }) => {
  if (isLoading) return <LoadingIndicator data-testid="loadingindicator-iupy" />;
  return (
    <PDFViewer id={id} data-testid="pdfviewer-jd5h">
      {children}
    </PDFViewer>
  );
});

// PDF Viewer should be used within a PDFLoader to ensure that any preparation of the document data is done before rendering
const PDFViewer = React.memo(({ id, children }) => {
  const [instance] = usePDF({ document: children });

  if (instance.loading) return <LoadingIndicator data-testid="loadingindicator-smyl" />;
  if (!instance.url) return <ErrorDisplay data-testid="errordisplay-k6pm" />;

  return (
    <FullIframe
      src={`${instance.url}#toolbar=0`}
      title={id}
      id={id}
      key={id}
      data-testid="fulliframe-v76w"
    />
  );
});

export const printPDF = elementId => {
  const iframe = document.getElementById(elementId);
  iframe.contentWindow.print();
};

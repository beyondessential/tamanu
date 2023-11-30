import React, { useState } from 'react';
import styled from 'styled-components';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Typography } from '@material-ui/core';
import { DOCUMENT_SOURCES } from '@tamanu/constants';

import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { Button } from '../Button';
import { SUPPORTED_DOCUMENT_TYPES } from '../../constants';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation/TranslatedText';

const getTitle = ({ source, name }) =>
  source === DOCUMENT_SOURCES.PATIENT_LETTER ? (
    <TranslatedText stringId="patient.patientLetter.title" fallback="Patient letter" />
  ) : (
    name
  );

const DownloadButton = ({ onClick }) => {
  return (
    <Button variant="outlined" size="small" startIcon={<GetAppIcon />} onClick={onClick}>
      <TranslatedText stringId="general.action.download" fallback="Download" />
    </Button>
  );
};

const Subtitle = styled(Typography)`
  font-size: 12px;
  color: ${props => props.theme.palette.text.secondary};
`;

const Preview = ({ documentType, attachmentId, ...props }) => {
  if (documentType === SUPPORTED_DOCUMENT_TYPES.PDF) {
    return <PDFPreview attachmentId={attachmentId} {...props} />;
  }
  if (documentType === SUPPORTED_DOCUMENT_TYPES.JPEG) {
    return <PhotoPreview attachmentId={attachmentId} />;
  }
  return (
    <TranslatedText
      stringId="documents.preview.unsupported"
      fallback="Preview is not supported for document type :documentType"
      replacements={{
        documentType,
      }}
    />
  );
};

export const DocumentPreviewModal = ({ open, onClose, onDownload, document, onPrintPDF }) => {
  const [scrollPage, setScrollPage] = useState(1);
  const [pageCount, setPageCount] = useState();
  const { type: documentType, attachmentId } = document;

  return (
    <Modal
      open={open}
      title={
        <div>
          {getTitle(document)}
          <Subtitle>
            {documentType === SUPPORTED_DOCUMENT_TYPES.PDF ? (
              <TranslatedText
                stringId="documents.preview.pageCount"
                fallback="Page :scrollPage of :pageCount"
                replacements={{
                  scrollPage,
                  pageCount,
                }}
              />
            ) : null}
          </Subtitle>
        </div>
      }
      printable={document.source === DOCUMENT_SOURCES.PATIENT_LETTER}
      onPrint={() => onPrintPDF(attachmentId)}
      additionalActions={[<DownloadButton onClick={onDownload} key="Download" />]}
      width="md"
      overrideContentPadding
      onClose={() => {
        setScrollPage(1);
        onClose();
      }}
    >
      <Preview
        documentType={documentType}
        attachmentId={attachmentId}
        pageCount={pageCount}
        setPageCount={setPageCount}
        scrollPage={scrollPage}
        setScrollPage={setScrollPage}
      />
    </Modal>
  );
};

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
import { useDocumentActions } from '../../hooks/useDocumentActions';

const getTitle = ({ source, name }) =>
  source === DOCUMENT_SOURCES.PATIENT_LETTER ? (
    <TranslatedText
      stringId="patient.modal.patientLetter.title"
      fallback="Patient letter"
      data-testid='translatedtext-y0qj' />
  ) : (
    name
  );

const DownloadButton = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<GetAppIcon />}
      onClick={onClick}
      data-testid='button-kx14'>
      <TranslatedText
        stringId="general.action.download"
        fallback="Download"
        data-testid='translatedtext-h5lj' />
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
      stringId="document.modal.preview.unsupported"
      fallback="Preview is not supported for document type :documentType"
      replacements={{
        documentType,
      }}
      data-testid='translatedtext-qr8h' />
  );
};

export const DocumentPreviewModal = ({ open, onClose, document = {} }) => {
  const [scrollPage, setScrollPage] = useState(1);
  const [pageCount, setPageCount] = useState(null);
  const { onDownload, onPrintPDF } = useDocumentActions();

  const { type: documentType, attachmentId } = document;
  const onHandleDownload = () => onDownload(document);
  const onHandlePrint = () => onPrintPDF(attachmentId);

  return (
    <Modal
      open={open}
      title={
        <div>
          {getTitle(document)}
          <Subtitle>
            {documentType === SUPPORTED_DOCUMENT_TYPES.PDF ? (
              <TranslatedText
                stringId="document.modal.preview.pageCount"
                fallback="Page :scrollPage of :pageCount"
                replacements={{
                  scrollPage,
                  pageCount: pageCount ?? '‒', // figure dash
                }}
                data-testid='translatedtext-5kuh' />
            ) : null}
          </Subtitle>
        </div>
      }
      printable={document.source !== DOCUMENT_SOURCES.UPLOADED}
      onPrint={onHandlePrint}
      additionalActions={[<DownloadButton onClick={onHandleDownload} key="Download" />]}
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

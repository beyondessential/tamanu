import React, { useState } from 'react';
import styled from 'styled-components';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Typography } from '@material-ui/core';
import { DOCUMENT_SOURCES } from '@tamanu/constants';
import { Button, Modal, TranslatedText } from '@tamanu/ui-components';

import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { SUPPORTED_DOCUMENT_TYPES } from '../../constants';
import { useDocumentActions } from '../../hooks/useDocumentActions';

const getTitle = ({ source, name }) =>
  source === DOCUMENT_SOURCES.PATIENT_LETTER ? (
    <TranslatedText
      stringId="patient.modal.patientLetter.title"
      fallback="Patient letter"
      data-testid="translatedtext-841k"
    />
  ) : (
    name
  );

const DownloadButton = ({ onClick }) => {
  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<GetAppIcon data-testid="getappicon-h47t" />}
      onClick={onClick}
      data-testid="button-54bc"
    >
      <TranslatedText
        stringId="general.action.download"
        fallback="Download"
        data-testid="translatedtext-llev"
      />
    </Button>
  );
};

const Subtitle = styled(Typography)`
  font-size: 12px;
  color: ${(props) => props.theme.palette.text.secondary};
`;

const Preview = ({ documentType, attachmentId, ...props }) => {
  if (documentType === SUPPORTED_DOCUMENT_TYPES.PDF) {
    return <PDFPreview attachmentId={attachmentId} {...props} data-testid="pdfpreview-l5hp" />;
  }
  if (documentType === SUPPORTED_DOCUMENT_TYPES.JPEG) {
    return <PhotoPreview attachmentId={attachmentId} data-testid="photopreview-6876" />;
  }
  return (
    <TranslatedText
      stringId="document.modal.preview.unsupported"
      fallback="Preview is not supported for document type :documentType"
      replacements={{
        documentType,
      }}
      data-testid="translatedtext-1mzr"
    />
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
          <Subtitle data-testid="subtitle-y9og">
            {documentType === SUPPORTED_DOCUMENT_TYPES.PDF ? (
              <TranslatedText
                stringId="document.modal.preview.pageCount"
                fallback="Page :scrollPage of :pageCount"
                replacements={{
                  scrollPage,
                  pageCount: pageCount ?? '‒', // figure dash
                }}
                data-testid="translatedtext-4zew"
              />
            ) : null}
          </Subtitle>
        </div>
      }
      printable={document.source !== DOCUMENT_SOURCES.UPLOADED}
      onPrint={onHandlePrint}
      additionalActions={[
        <DownloadButton
          onClick={onHandleDownload}
          key="Download"
          data-testid="downloadbutton-m97w"
        />,
      ]}
      width="md"
      overrideContentPadding
      onClose={() => {
        setScrollPage(1);
        onClose();
      }}
      data-testid="modal-lnv7"
    >
      <Preview
        documentType={documentType}
        attachmentId={attachmentId}
        pageCount={pageCount}
        setPageCount={setPageCount}
        scrollPage={scrollPage}
        setScrollPage={setScrollPage}
        data-testid="preview-f4tk"
      />
    </Modal>
  );
};

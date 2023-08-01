import React, { useState } from 'react';
import styled from 'styled-components';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Typography } from '@material-ui/core';
import { DOCUMENT_SOURCES } from '@tamanu/shared/constants';

import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { Button } from '../Button';
import { SUPPORTED_DOCUMENT_TYPES } from '../../constants';

const getTitle = ({ source, name }) =>
  source === DOCUMENT_SOURCES.PATIENT_LETTER ? 'Patient letter' : name;

const DownloadButton = ({ onClick }) => {
  return (
    <Button variant="outlined" size="small" startIcon={<GetAppIcon />} onClick={onClick}>
      Download
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
  return `Preview is not supported for document type ${documentType}`;
};

export const DocumentPreviewModal = ({ open, onClose, onDownload, document }) => {
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
            {documentType === SUPPORTED_DOCUMENT_TYPES.PDF
              ? `Page ${scrollPage} of ${pageCount ?? 'Unknown'}`
              : null}
          </Subtitle>
        </div>
      }
      printable={document.source === DOCUMENT_SOURCES.PATIENT_LETTER}
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

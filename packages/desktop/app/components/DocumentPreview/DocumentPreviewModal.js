import React, { useState } from 'react';
import styled from 'styled-components';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Typography } from '@material-ui/core';
import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { Button } from '../Button';
import { DOCUMENT_TYPES, PDF_DOCUMENT_TYPES } from '../../constants';

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
  if (PDF_DOCUMENT_TYPES.includes(documentType)) {
    return <PDFPreview attachmentId={attachmentId} {...props} />;
  }
  if (documentType === DOCUMENT_TYPES.RAW_JPEG) {
    return <PhotoPreview attachmentId={attachmentId} />;
  }
  return `Preview is not supported for document type ${documentType}`;
};

export const DocumentPreviewModal = ({
  open,
  title,
  attachmentId,
  documentType,
  onClose,
  onDownload,
}) => {
  const [scrollPage, setScrollPage] = useState(1);
  const [pageCount, setPageCount] = useState();

  return (
    <Modal
      open={open}
      title={
        <div>
          {title}
          <Subtitle>
            {PDF_DOCUMENT_TYPES.includes(documentType)
              ? `Page ${scrollPage} of ${pageCount}`
              : null}
          </Subtitle>
        </div>
      }
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

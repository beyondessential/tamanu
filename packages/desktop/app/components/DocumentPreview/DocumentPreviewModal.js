import React, { useState } from 'react';

import GetAppIcon from '@material-ui/icons/GetApp';
import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';
import PhotoPreview from './PhotoPreview';
import { Button } from '../Button';
import { SUPPORTED_DOCUMENT_TYPES } from '../../constants';

const DownloadButton = ({ onClick }) => {
  return (
    <Button variant="outlined" size="small" startIcon={<GetAppIcon />} onClick={onClick}>
      Download
    </Button>
  );
};

const Preview = ({ documentType, attachmentId, ...props }) => {
  if (documentType === SUPPORTED_DOCUMENT_TYPES.PDF) {
    return <PDFPreview attachmentId={attachmentId} {...props} />;
  }
  if (documentType === SUPPORTED_DOCUMENT_TYPES.JPEG) {
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
      title={title}
      subtitle={
        documentType === SUPPORTED_DOCUMENT_TYPES.PDF ? `Page ${scrollPage} of ${pageCount}` : null
      }
      additionalActions={[<DownloadButton onClick={onDownload} key="Download" />]}
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

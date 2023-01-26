import React, { useState } from 'react';

import GetAppIcon from '@material-ui/icons/GetApp';
import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';
import { Button } from '../Button';

const DownloadButton = ({ onClick }) => {
  return (
    <Button variant="outlined" size="small" startIcon={<GetAppIcon />} onClick={onClick}>
      Download
    </Button>
  );
};

export const DocumentPreviewModal = ({ open, title, attachmentId, onClose, onDownload }) => {
  const [scrollPage, setScrollPage] = useState(1);
  const [pageCount, setPageCount] = useState();

  return (
    <Modal
      open={open}
      title={title}
      subtitle={`Page ${scrollPage} of ${pageCount}`}
      additionalActions={[<DownloadButton onClick={onDownload} />]}
      onClose={onClose}
    >
      <PDFPreview
        attachmentId={attachmentId}
        pageCount={pageCount}
        setPageCount={setPageCount}
        scrollPage={scrollPage}
        setScrollPage={setScrollPage}
      />
    </Modal>
  );
};

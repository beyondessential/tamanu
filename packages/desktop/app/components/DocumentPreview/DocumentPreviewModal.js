import React from 'react';

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

export const DocumentPreviewModal = ({ open, title, attachmentId, onClose, onDownload }) => (
  <Modal
    open={open}
    title={title}
    additionalActions={[<DownloadButton onClick={onDownload} />]}
    onClose={onClose}
  >
    <PDFPreview attachmentId={attachmentId} />
  </Modal>
);

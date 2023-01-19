import React from 'react';

import { Modal } from '../Modal';
import PDFPreview from './PDFPreview';

export const DocumentPreviewModal = ({ open, title, attachmentId, onClose }) => (
  <Modal open={open} title={title} /* additionalActions={<DownloadButton/>} */ onClose={onClose}>
    <PDFPreview attachmentId={attachmentId} />
  </Modal>
);

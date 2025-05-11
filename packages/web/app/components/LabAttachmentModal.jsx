import React from 'react';
import { DocumentPreviewModal } from './DocumentPreview';
import { SUPPORTED_CONTENT_TYPES } from '@tamanu/constants';

export const LabAttachmentModal = ({ open, onClose, labRequest = {} }) => {
  const { latestAttachment = {} } = labRequest;
  const { attachmentId, title } = latestAttachment;
  // Lab attachments do not use the document metadata model, so we
  // create the needed information to reuse the functionality
  const document = {
    type: SUPPORTED_CONTENT_TYPES.PDF,
    attachmentId: attachmentId,
    name: title,
  };

  return (
    <DocumentPreviewModal
      open={open}
      onClose={onClose}
      document={document}
      data-testid="documentpreviewmodal-2brc"
    />
  );
};

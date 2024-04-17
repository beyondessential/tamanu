import React from 'react';
import { DocumentPreviewModal } from './DocumentPreview';
import { SUPPORTED_CONTENT_TYPES } from '@tamanu/constants';

// TODO SAV-587: Remove these before merge
const testId = '8993658e-330f-482e-a9ad-e69abd9c9e28';
const testTitle = 'HGU59KRC';

export const LabAttachmentModal = ({ open, onClose, labRequest = {} }) => {
  const { latestAttachment = {} } = labRequest;
  const { id, title } = latestAttachment;
  // Lab attachments do not use the document metadata model, so we
  // create the needed information to reuse the functionality
  const document = {
    // TODO SAV-587: this is fraught as we only store the type in the attachment,
    // which we cannot check in the facility server
    type: SUPPORTED_CONTENT_TYPES.PDF,
    attachmentId: id || testId,
    name: title || testTitle,
  };

  return (
    <DocumentPreviewModal
      open={open}
      onClose={onClose}
      document={document}
    />
  );
};

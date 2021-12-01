import React from 'react';

import { Modal } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';

export const DocumentModal = ({ title, actionText, open, onClose, onSubmit }) => {
  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <DocumentForm
        actionText={actionText}
        onSubmit={onSubmit}
        onCancel={onClose}
        editedObject={document}
      />
    </Modal>
  );
};

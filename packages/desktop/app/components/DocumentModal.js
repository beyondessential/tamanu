import React, { useState, useEffect, useCallback } from 'react';

import { useApi } from '../api';

import { Modal } from './Modal';
import { DocumentForm } from '../forms/DocumentForm';

export const DocumentModal = ({
  title,
  actionText,
  open,
  onClose,
  onSubmit,
  onSaved,
  documentId,
}) => {
  const [document, setDocument] = useState({});
  const api = useApi();

  useEffect(() => {
    if (documentId) {
      (async () => {})();
    }
  }, []);
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

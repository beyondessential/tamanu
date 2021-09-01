import React, { useCallback } from 'react';
import { Modal } from './Modal';

import { ChangeLaboratoryForm } from '../forms/ChangeLaboratoryForm';
import { useLabRequest } from '../contexts/LabRequest';

export const ChangeLaboratoryModal = ({ onClose, open }) => {
  const { updateLabRequest, labRequest } = useLabRequest();
  const onSubmit = useCallback(
    data => {
      updateLabRequest(labRequest.id, data);
      onClose();
    },
    [labRequest],
  );

  return (
    <Modal open={open} onClose={onClose} title="Change lab request laboratory">
      <ChangeLaboratoryForm labRequest={labRequest} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
};

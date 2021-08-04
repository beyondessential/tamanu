import React, { useCallback } from 'react';

import { Modal } from './Modal';

import { useLabRequest } from '../contexts/LabRequest';
import { useApi } from '../api';
import { ChangeLabStatusForm } from '../forms/ChangeLabStatusForm';

export const ChangeLabStatusModal = ({ onClose, open }) => {
  const { updateLabRequest, labRequest } = useLabRequest();
  const api = useApi();
  const onSubmit = useCallback(
    ({ status }) => {
      updateLabRequest(labRequest.id, { status, userId: api.user.id });
      onClose();
    },
    [labRequest],
  );

  return (
    <Modal open={open} onClose={onClose} title="Change lab request status">
      <ChangeLabStatusForm labRequest={labRequest} onSubmit={onSubmit} onCancel={onClose} />
    </Modal>
  );
};

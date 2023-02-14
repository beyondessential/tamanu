import React, { useCallback } from 'react';

import { Modal } from '../../../components';
import { useApi } from '../../../api';

export const NewRecordModal = ({ endpoint, title, open, Form, onCancel }) => {
  const api = useApi();
  const onSubmit = useCallback(
    async data => {
      await api.post(endpoint, data);
      onCancel();
    },
    [api, endpoint, onCancel],
  );
  return (
    <Modal title={title} open={open} onClose={onCancel}>
      <Form onSubmit={onSubmit} onCancel={onCancel} />
    </Modal>
  );
};

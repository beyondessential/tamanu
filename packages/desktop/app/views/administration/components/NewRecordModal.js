import React, { useCallback } from 'react';

import { FormModal } from '../../../components/FormModal';
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
    <FormModal title={title} open={open} onClose={onCancel}>
      <Form onSubmit={onSubmit} onCancel={onCancel} />
    </FormModal>
  );
};

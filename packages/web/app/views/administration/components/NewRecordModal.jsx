import React, { useCallback } from 'react';

import { FORM_TYPES } from '@tamanu/constants/forms';

import { FormModal } from '../../../components/FormModal';
import { useApi } from '../../../api';

export const NewRecordModal = ({ endpoint, title, open, Form, onCancel }) => {
  const api = useApi();
  const onSubmit = useCallback(
    async (data) => {
      await api.post(endpoint, data);
      onCancel();
    },
    [api, endpoint, onCancel],
  );
  return (
    <FormModal title={title} open={open} onClose={onCancel} data-testid="formmodal-t9up">
      <Form
        formType={FORM_TYPES.CREATE_FORM}
        onSubmit={onSubmit}
        onCancel={onCancel}
        data-testid="form-3g87"
      />
    </FormModal>
  );
};

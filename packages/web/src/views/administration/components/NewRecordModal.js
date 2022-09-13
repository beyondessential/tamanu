import React, { memo } from 'react';

import { Modal } from '../../../components';
import { connectApi } from '../../../api';

const DumbNewRecordModal = memo(({ title, open, Form, onSubmit, onCancel }) => (
  <Modal title={title} open={open} onClose={onCancel}>
    <Form onSubmit={onSubmit} onCancel={onCancel} />
  </Modal>
));

export const NewRecordModal = connectApi((api, dispatch, { endpoint, onCancel }) => ({
  onSubmit: async data => {
    await api.post(endpoint, data);
    onCancel();
  },
}))(DumbNewRecordModal);

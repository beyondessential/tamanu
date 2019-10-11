import React, { memo } from 'react';

import { Modal } from '../../../components';
import { connectApi } from '../../../api';
import { SeedRecordsForm } from '../../../forms';

const DumbSeedRecordsModal = memo(({ open, onSubmit, onCancel }) => (
  <Modal title="Add demo records" open={open} onClose={onCancel}>
    <SeedRecordsForm onSubmit={onSubmit} onCancel={onCancel} />
  </Modal>
));

export const SeedRecordsModal = connectApi((api, dispatch, { endpoint, onCancel }) => ({
  onSubmit: async data => {
    await api.post(`seed/${endpoint}`, data);
    onCancel();
  },
}))(DumbSeedRecordsModal);

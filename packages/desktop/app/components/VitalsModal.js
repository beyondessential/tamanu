import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';

import { VitalsForm } from '../forms/VitalsForm';

export const VitalsModal = connectApi(api => ({ api }))(React.memo(({ api, onClose, open, visitId }) => {
  const onSubmit = async (data) => {
    const resp = await api.post(`visit/${visitId}/vitals`, data);
    onClose();
  };

  return (
    <Modal title="Record vitals" isVisible={true} onClose={onClose}>
      <VitalsForm
        form={VitalsForm}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}));


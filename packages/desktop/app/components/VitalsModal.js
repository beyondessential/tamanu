import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';

import { VitalsForm } from '../forms/VitalsForm';

export const VitalsModal = connectApi(api => ({ api }))(React.memo(({ api, onClose, open, visitId }) => {
  const onSubmit = async (data) => {
    await api.post("/addVitals", {
      visitId,
      vitals: data,
    });
    onClose();
  };

  return (
    <Modal title="" isVisible={true} onClose={onClose}>
      <VitalsForm
        endpoint="/actions/addVitals"
        form={VitalsForm}
        onSubmit={onSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}));


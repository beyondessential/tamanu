import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewVisit } from '../store/visit';

import { VitalsForm } from '../forms/VitalsForm';

const DumbVitalsModal = React.memo(({ onClose, onSubmit }) => (
  <Modal title="Record vitals" open onClose={onClose}>
    <VitalsForm form={VitalsForm} onSubmit={onSubmit} onCancel={onClose} />
  </Modal>
));

export const VitalsModal = connectApi((api, dispatch, { visitId, onClose }) => ({
  onSubmit: async data => {
    await api.post(`visit/${visitId}/vitals`, data);
    dispatch(viewVisit(visitId));
    onClose();
  },
}))(DumbVitalsModal);

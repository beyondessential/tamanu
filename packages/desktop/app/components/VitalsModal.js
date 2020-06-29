import React from 'react';

import { Modal } from './Modal';

import { connectApi } from '../api/connectApi';
import { viewEncounter } from '../store/encounter';

import { VitalsForm } from '../forms/VitalsForm';

const DumbVitalsModal = React.memo(({ onClose, onSubmit }) => (
  <Modal title="Record vitals" open onClose={onClose}>
    <VitalsForm form={VitalsForm} onSubmit={onSubmit} onCancel={onClose} />
  </Modal>
));

export const VitalsModal = connectApi((api, dispatch, { encounterId, onClose }) => ({
  onSubmit: async data => {
    await api.post(`vitals`, {
      ...data,
      encounterId,
    });
    dispatch(viewEncounter(encounterId));
    onClose();
  },
}))(DumbVitalsModal);

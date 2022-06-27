import React from 'react';

import { useApi } from '../api';

import { Modal } from './Modal';
import { VitalsForm } from '../forms/VitalsForm';

export const VitalsModal = ({ open, onClose, onSaved, encounterId }) => {
  const api = useApi();

  return (
    <Modal title="Record vitals" open={open} onClose={onClose}>
      <VitalsForm
        onSubmit={async data => {
          await api.post(`vitals`, { ...data, encounterId });
          onSaved();
        }}
        onCancel={onClose}
      />
    </Modal>
  );
};

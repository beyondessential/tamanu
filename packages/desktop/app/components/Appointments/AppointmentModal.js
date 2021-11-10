import React from 'react';

import { Modal } from '../Modal';
import { AppointmentForm } from './AppointmentForm';

export const AppointmentModal = ({ open, onClose, onSuccess }) => {
  return (
    <Modal width="md" title="Create new appointment" open={open} onClose={onClose}>
      <AppointmentForm
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
      />
    </Modal>
  );
};

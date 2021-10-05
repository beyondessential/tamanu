import React from 'react';

import { Modal } from '../Modal';
import { NewAppointmentForm } from './NewAppointmentForm';

export const NewAppointmentModal = ({ open, onClose, onSuccess }) => {
  return (
    <Modal width="md" title="Create new appointment" open={open} onClose={onClose}>
      <NewAppointmentForm
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
      />
    </Modal>
  );
};

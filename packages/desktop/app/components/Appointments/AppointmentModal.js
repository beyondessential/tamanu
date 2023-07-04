import React from 'react';

import { Modal } from '../Modal';
import { AppointmentForm } from './AppointmentForm';

export const AppointmentModal = ({ open, onClose, onSuccess, appointment }) => {
  const isUpdating = !!appointment;
  return (
    <Modal
      width="md"
      title={isUpdating ? 'Update appointment' : 'Create new appointment'}
      open={open}
      onClose={onClose}
    >
      <AppointmentForm
        appointment={appointment}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
      />
    </Modal>
  );
};

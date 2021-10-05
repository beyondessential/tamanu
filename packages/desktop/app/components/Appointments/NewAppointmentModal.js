import React from 'react';

import { Modal } from '../Modal';
import NewAppointmentForm from './NewAppointmentForm';

export default function NewAppointmentModal(props) {
  const { open, onClose, onSuccess } = props;
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
}

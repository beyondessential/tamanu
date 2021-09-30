import React from 'react';

import { Modal } from '../Modal';
import NewAppointmentForm from './NewAppointmentForm';

export default function NewAppointmentModal(props) {
  const { open, onClose } = props;
  return (
    <Modal width="md" title="Create new appointment" open={open} onClose={onClose}>
      <NewAppointmentForm done={onClose} />
    </Modal>
  );
}

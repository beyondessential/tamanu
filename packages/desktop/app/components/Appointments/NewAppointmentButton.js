import React, { useState } from 'react';
import { NewAppointmentModal } from './NewAppointmentModal';
import { Button } from '..';

export default function NewAppointmentButton(props) {
  const { onSuccess } = props;
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        color="primary"
        variant="outlined"
        onClick={() => {
          setOpenModal(true);
        }}
      >
        New Appointment
      </Button>
      <NewAppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}

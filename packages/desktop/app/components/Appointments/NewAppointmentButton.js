import React, { useState } from 'react';
import { NewAppointmentModal } from './NewAppointmentModal';
import { Button } from '..';

export const NewAppointmentButton = ({ onSuccess }) => {
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
        New appointment
      </Button>
      <NewAppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
      />
    </>
  );
};

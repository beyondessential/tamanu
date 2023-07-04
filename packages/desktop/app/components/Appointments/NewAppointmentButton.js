import React, { useState } from 'react';
import { AppointmentModal } from './AppointmentModal';
import { Button } from '..';

export const NewAppointmentButton = ({ onSuccess }) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <Button
        color="primary"
        variant="contained"
        onClick={() => {
          setOpenModal(true);
        }}
      >
        New appointment
      </Button>
      <AppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
      />
    </>
  );
};

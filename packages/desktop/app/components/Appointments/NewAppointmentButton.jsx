import React, { useState } from 'react';
import { Button } from '..';
import { AppointmentModal } from './AppointmentModal';

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

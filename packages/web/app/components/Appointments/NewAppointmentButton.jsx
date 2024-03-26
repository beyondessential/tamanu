import React, { useState } from 'react';
import { AppointmentModal } from './AppointmentModal';
import { Button } from '..';
import { TranslatedText } from '../Translation/TranslatedText';

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
        <TranslatedText stringId="scheduling.action.newAppointment" fallback="New appointment" />
      </Button>
      <AppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
      />
    </>
  );
};

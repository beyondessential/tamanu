import React, { useState } from 'react';
import { AppointmentModal } from './AppointmentModal';
import { ButtonWithPermissionCheck } from '..';
import { TranslatedText } from '../Translation/TranslatedText';

export const NewAppointmentButton = ({ onSuccess }) => {
  const [openModal, setOpenModal] = useState(false);
  return (
    <>
      <ButtonWithPermissionCheck
        verb="write"
        noun="Appointment"
        color="primary"
        variant="contained"
        onClick={() => {
          setOpenModal(true);
        }}
      >
        <TranslatedText stringId="scheduling.action.newAppointment" fallback="New appointment" />
      </ButtonWithPermissionCheck>
      <AppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
      />
    </>
  );
};

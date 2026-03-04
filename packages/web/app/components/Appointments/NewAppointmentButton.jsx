import React, { useState } from 'react';
import { ButtonWithPermissionCheck } from '@tamanu/ui-components';
import { AppointmentModal } from './AppointmentModal';
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
        data-testid="buttonwithpermissioncheck-6wy8"
      >
        <TranslatedText
          stringId="scheduling.action.newAppointment"
          fallback="New appointment"
          data-testid="translatedtext-nmm5"
        />
      </ButtonWithPermissionCheck>
      <AppointmentModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={onSuccess}
        data-testid="appointmentmodal-bfpn"
      />
    </>
  );
};

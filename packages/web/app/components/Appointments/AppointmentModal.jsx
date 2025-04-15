import React from 'react';

import { FormModal } from '../FormModal';
import { AppointmentForm } from './AppointmentForm';
import { TranslatedText } from '../Translation/TranslatedText';

export const AppointmentModal = ({ open, onClose, onSuccess, appointment }) => {
  const isUpdating = !!appointment;
  return (
    <FormModal
      width="md"
      title={
        isUpdating ? (
          <TranslatedText
            stringId="scheduling.modal.appointment.title.updateAppointment"
            fallback="Update appointment"
            data-testid="translatedtext-1sov"
          />
        ) : (
          <TranslatedText
            stringId="scheduling.modal.appointment.title.createNewAppointment"
            fallback="Create new appointment"
            data-testid="translatedtext-3we8"
          />
        )
      }
      open={open}
      onClose={onClose}
      data-testid="formmodal-e7bf"
    >
      <AppointmentForm
        appointment={appointment}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
        data-testid="appointmentform-cryc"
      />
    </FormModal>
  );
};

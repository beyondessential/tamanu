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
          />
        ) : (
          <TranslatedText
            stringId="scheduling.modal.appointment.title.createNewAppointment"
            fallback="Create new appointment"
          />
        )
      }
      open={open}
      onClose={onClose}
    >
      <AppointmentForm
        appointment={appointment}
        onCancel={onClose}
        onSuccess={() => {
          onClose();
          onSuccess();
        }}
      />
    </FormModal>
  );
};

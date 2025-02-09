import React from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components';

export const CreateFromNewConfirmModal = ({ open, onCancel, onConfirm }) => {
  return (
    <ConfirmModal
      title={
        <TranslatedText
          stringId="scheduling.modal.appointment.title.createNewAppointment"
          fallback="Create new appointment"
        />
      }
      text={
        <TranslatedText
          stringId="scehduling.modal.appointment.createFromNewWarningText"
          fallback="This appointment is repeating and there may be future instances of this appointment already scheduled. Would you like to continue scheduling a new appointment?"
        />
      }
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
};

import React from 'react';
import { ConfirmModal } from '../../ConfirmModal';
import { TranslatedText } from '../../Translation';

export const ModifyRepeatingAppointmentModal = ({ open, onClose }) => {
  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="outpatientAppointment.modal.modifyRepeatingAppointment.title"
          fallback="Modify appointment"
        />
      }
      confirmButtonText={<TranslatedText stringId="general.action.continue" fallback="Continue" />}
    ></ConfirmModal>
  );
};

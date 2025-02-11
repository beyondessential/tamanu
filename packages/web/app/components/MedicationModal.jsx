import React from 'react';

import { FormModal } from './FormModal';
import { MedicationForm } from '../forms/MedicationForm';
import { TranslatedText } from './Translation/TranslatedText';

export const MedicationModal = ({ open, onClose, onSaved, encounterId }) => {
  return (
    <FormModal
      title={
        <TranslatedText
          stringId="medication.modal.newPrescription.title"
          fallback="New prescription"
        />
      }
      open={open}
      onClose={onClose}
    >
      <MedicationForm
        encounterId={encounterId}
        onCancel={onClose}
        onSaved={onSaved}
      />
    </FormModal>
  );
};

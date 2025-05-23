import React from 'react';
import { Box } from '@material-ui/core';
import { Modal, TranslatedText } from '..';

export const ReviewMedicationSetModal = ({ open, onClose }) => {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <TranslatedText
          stringId="medication.modal.reviewMedicationSet.title"
          fallback="Review Medication Set"
        />
      }
    >
      <Box display="flex" alignItems="center" justifyContent="center">
        <TranslatedText
          stringId="medication.modal.reviewMedicationSet.description"
          fallback="Please review the medication set before creating the prescriptions."
        />
      </Box>
    </Modal>
  );
};

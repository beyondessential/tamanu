import React from 'react';

import { FormModal } from '../FormModal';
import { MedicationForm } from '../../forms/MedicationForm';
import { TranslatedText } from '../Translation/TranslatedText';
import styled from 'styled-components';

const StyledFormModal = styled(FormModal)`
  .MuiPaper-root {
    max-width: 670px;
  }
`;

export const MedicationModal = ({ open, onClose, onSaved, encounterId, isOngoingPrescription }) => {
  return (
    <StyledFormModal
      title={
        isOngoingPrescription ? (
          <TranslatedText
            stringId="medication.modal.newOngoingPrescription.title"
            fallback="Add ongoing medication"
          />
        ) : (
          <TranslatedText
            stringId="medication.modal.newPrescription.title"
            fallback="New prescription"
          />
        )
      }
      open={open}
      onClose={onClose}
    >
      <MedicationForm
        encounterId={encounterId}
        onCancel={onClose}
        onSaved={onSaved}
        isOngoingPrescription={isOngoingPrescription}
      />
    </StyledFormModal>
  );
};

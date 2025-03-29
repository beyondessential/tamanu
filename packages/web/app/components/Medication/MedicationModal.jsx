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

export const MedicationModal = ({ open, onClose, onSaved, encounterId }) => {
  return (
    <StyledFormModal
      title={
        <TranslatedText
          stringId="medication.modal.newPrescription.title"
          fallback="New prescription"
        />
      }
      open={open}
      onClose={onClose}
    >
      <MedicationForm encounterId={encounterId} onCancel={onClose} onSaved={onSaved} />
    </StyledFormModal>
  );
};

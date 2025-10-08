import React from 'react';
import styled from 'styled-components';

import { ConfirmModal } from '../../../components/ConfirmModal';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { BodyText } from '../../../components/Typography';

const ContentText = styled(BodyText)`
  text-align: left;
  font-weight: 400;
  padding: 55px 65px;
`;

const StyledConfirmModal = styled(ConfirmModal)`
  .MuiPaper-root {
    max-width: 700px;
  }
`;

export const CancelNewPatientConfirmationModal = ({ open, onClose, onCancelConfirm }) => (
  <StyledConfirmModal
    open={open}
    onCancel={onClose}
    onConfirm={onCancelConfirm}
    title={
      <TranslatedText
        stringId="patient.modal.cancelNewPatient.title"
        fallback="Cancel new patient"
        data-testid="translatedtext-cancel-title"
      />
    }
    text={
      <ContentText>
        <TranslatedText
          stringId="patient.modal.cancelNewPatient.unsavedWarning"
          fallback="You have unsaved changes. Are you sure you would like to discard these changes and cancel adding the new patient?"
          data-testid="translatedtext-cancel-warning"
        />
      </ContentText>
    }
    cancelButtonText={
      <TranslatedText
        stringId="patient.modal.cancelNewPatient.back"
        fallback="Back to adding new patient"
        data-testid="translatedtext-cancel-back"
      />
    }
    confirmButtonText={
      <TranslatedText
        stringId="patient.modal.cancelNewPatient.confirm"
        fallback="Cancel adding new patient"
        data-testid="translatedtext-cancel-confirm"
      />
    }
  />
);

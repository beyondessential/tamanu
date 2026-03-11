import React from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';

const StyledConfirmModal = styled(ConfirmModal)`
  .MuiDialog-paperWidthSm {
    max-width: 640px;
  }
`;

const Content = styled.div`
  font-size: 14px;
  margin-bottom: -12px;
  padding: 0 64px;
  height: 180px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  justify-content: center;
`;

export const CancelDispensedMedicationModal = ({ open, onClose, onConfirm }) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId="medication.cancelDispensedMedication.modal.title"
          fallback="Cancel dispensed medication"
        />
      }
      customContent={
        <Content>
          <span>
            <TranslatedText
              stringId="medication.cancelDispensedMedication.modal.text"
              fallback="Are you sure you would like to cancel this dispensed medication record?"
            />
          </span>
          <span>
            <TranslatedText
              stringId="medication.cancelDispensedMedication.modal.explanation"
              fallback="The request will be moved back to the active requests table."
            />
          </span>
        </Content>
      }
      cancelButtonText={
        <TranslatedText
          stringId="medication.cancelDispensedMedication.modal.cancelButton"
          fallback="Go back"
        />
      }
      confirmButtonText={
        <TranslatedText
          stringId="medication.cancelDispensedMedication.modal.confirmButton"
          fallback="Cancel dispensed medication record"
        />
      }
    />
  );
};

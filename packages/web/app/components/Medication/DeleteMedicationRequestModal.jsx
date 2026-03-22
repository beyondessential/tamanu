import React from 'react';
import { ConfirmModal } from '../ConfirmModal';
import { TranslatedText } from '../Translation';
import styled from 'styled-components';
import { Box } from '@mui/material';

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
  gap: 16px;
  justify-content: center;
`;

export const DeleteMedicationRequestModal = ({ open, onClose, onConfirm }) => {
  return (
    <StyledConfirmModal
      open={open}
      onCancel={onClose}
      onConfirm={onConfirm}
      title={
        <TranslatedText
          stringId="medication.deleteMedicationRequest.modal.title"
          fallback="Delete medication request"
        />
      }
      customContent={
        <Content>
          <span>
            <TranslatedText
              stringId="medication.deleteMedicationRequest.modal.text"
              fallback="Are you sure you would like to delete this medication request?"
            />
          </span>
          <Box component="span" fontWeight={500}>
            <TranslatedText
              stringId="medication.deleteMedicationRequest.modal.irreversible"
              fallback="This action is irreversible."
            />
          </Box>
        </Content>
      }
      confirmButtonText={
        <TranslatedText
          stringId="medication.deleteMedicationRequest.modal.confirmButton"
          fallback="Delete medication request"
        />
      }
    />
  );
};

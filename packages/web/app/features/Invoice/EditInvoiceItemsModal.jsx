import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { InvoiceForm } from './InvoiceForm';
import { Colors } from '../../constants/styles';

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 1150px;
    width: 90vw;
  }
`;

const ModalBody = styled.div`
  padding: 20px 8px;
`;

const Description = styled(Typography)`
  &.MuiTypography-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    margin-bottom: 20px;
  }
`;

export const EditInvoiceItemsModal = ({ open, onClose, invoice }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <StyledModal
      title={<TranslatedText stringId="invoice.modal.edit.title" fallback="Edit invoice" />}
      open={open}
      onClose={handleClose}
    >
      <ModalBody>
        <Description>
          <TranslatedText
            stringId="invoice.modal.edit.description"
            fallback="Edit invoice items below."
          />
        </Description>
        <InvoiceForm
          invoice={invoice}
          isPatientView={false}
          isEditing={true}
          setIsEditing={() => {}}
          onSave={handleClose}
          onCancel={handleClose}
        />
      </ModalBody>
    </StyledModal>
  );
};

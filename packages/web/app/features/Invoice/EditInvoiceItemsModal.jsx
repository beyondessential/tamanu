import React from 'react';
import styled from 'styled-components';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { InvoiceForm } from './InvoiceForm';

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 1200px;
    width: 90vw;
  }
`;

const ModalBody = styled.div`
  margin: 20px 0;
`;

export const EditInvoiceItemsModal = ({ open, onClose, invoice }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="invoice.modal.editItems.title"
          fallback="Edit invoice items"
        />
      }
      open={open}
      onClose={handleClose}
    >
      <ModalBody>
        <InvoiceForm
          invoice={invoice}
          isPatientView={false}
          isEditing={true}
          setIsEditing={() => {}}
          onSave={handleClose}
        />
      </ModalBody>
    </StyledModal>
  );
};

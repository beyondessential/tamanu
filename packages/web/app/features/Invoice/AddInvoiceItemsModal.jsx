import React from 'react';
import styled from 'styled-components';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { InvoiceForm } from './InvoiceForm';
import { Colors } from '../../constants/styles';

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 1200px;
    width: 90vw;
  }
`;

const ModalBody = styled.div`
  background: ${Colors.background};
  padding: 40px;
`;

const Description = styled.p`
  font-size: 14px;
  color: ${Colors.darkestText};
  margin: 0 0 20px 0;
`;

const TableCard = styled.div`
  background: ${Colors.white};
  border-radius: 3px;
  overflow: hidden;
`;

export const AddInvoiceItemsModal = ({ open, onClose, invoice }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <StyledModal
      title={
        <TranslatedText
          stringId="invoice.modal.addItems.title"
          fallback="Add items"
        />
      }
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
        <TableCard>
          <InvoiceForm
            invoice={invoice}
            isPatientView={false}
            isEditing={false}
            isModal={true}
            startWithBlankRow={true}
            setIsEditing={() => {}}
            onSave={handleClose}
          />
        </TableCard>
      </ModalBody>
    </StyledModal>
  );
};

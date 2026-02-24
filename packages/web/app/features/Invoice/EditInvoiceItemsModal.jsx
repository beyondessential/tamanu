import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { InvoiceForm } from './InvoiceForm';
import { Colors } from '../../constants/styles';
import { INVOICE_FORM_TYPE } from './constants.js';

const StyledModal = styled(Modal)`
  .MuiPaper-root {
    max-width: 1150px;
    width: 90vw;
  }
`;

const ModalBody = styled.div`
  padding: 20px 8px 0;
`;

const Description = styled(Typography)`
  &.MuiTypography-root {
    font-size: 14px;
    color: ${Colors.darkestText};
    margin-bottom: 20px;
  }
`;

export const EditInvoiceItemsModal = ({ open, onClose, invoice }) => {
  return (
    <StyledModal
      title={<TranslatedText stringId="invoice.modal.edit.title" fallback="Edit invoice" />}
      open={open}
      onClose={onClose}
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
          onClose={onClose}
          invoiceFormType={INVOICE_FORM_TYPE.EDIT_ITEMS}
        />
      </ModalBody>
    </StyledModal>
  );
};

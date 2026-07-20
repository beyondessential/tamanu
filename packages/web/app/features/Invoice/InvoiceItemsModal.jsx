import React from 'react';
import styled from 'styled-components';
import Typography from '@mui/material/Typography';

import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { InvoiceForm } from './InvoiceForm';

const ModalBody = styled.div`
  padding: 20px 8px 0;
`;

const Description = styled(Typography)`
  &.MuiTypography-root {
    font-size: 14px;
    margin-block-end: 20px;
  }
`;

export const InvoiceItemsModal = ({ open, onClose, invoice, title, invoiceFormType }) => {
  return (
    <Modal title={title} open={open} onClose={onClose} width="lg">
      <ModalBody>
        <Description>
          <TranslatedText
            stringId="invoice.modal.edit.description"
            fallback="Edit invoice items below"
          />
        </Description>
        <InvoiceForm invoice={invoice} invoiceFormType={invoiceFormType} onClose={onClose} />
      </ModalBody>
    </Modal>
  );
};

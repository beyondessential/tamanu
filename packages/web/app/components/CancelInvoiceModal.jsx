import React from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';
import { TranslatedText } from './Translation';
import { ModalActionRow } from './ModalActionRow';
import { useApi } from '../api';
import { INVOICE_STATUSES } from '@tamanu/constants';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const CancelInvoiceModal = React.memo(({ open, onClose, invoiceId, afterAction }) => {
  const api = useApi();

  const cancelInvoice = async () => {
    await api.put(`invoices/${invoiceId}`, {
      status: INVOICE_STATUSES.CANCELLED,
    });
    onClose();
    afterAction?.();
    onClose();
  };

  return (
    <Modal
      width="sm"
      title={
        <TranslatedText stringId="invoice.modal.cancelInvoice.title" fallback="Cancel invoice" />
      }
      open={open}
      onClose={onClose}
    >
      <ContentText>
        <TranslatedText
          stringId="invoice.modal.cancelInvoice.warningText"
          fallback="Are you sure you would like to cancel this invoice? This cannot be undone."
        />
      </ContentText>
      <ModalActionRow onConfirm={cancelInvoice} onCancel={onClose} />
    </Modal>
  );
});

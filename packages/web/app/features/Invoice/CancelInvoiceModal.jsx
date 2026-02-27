import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useCancelInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 30px auto 60px auto;
  max-width: 440px;
  white-space: pre-wrap;
`;

export const CancelInvoiceModal = ({ open, onClose, invoice }) => {
  const { mutate } = useCancelInvoice(invoice);

  const cancelInvoice = async () => {
    mutate(
      {},
      {
        onSuccess: onClose,
      },
    );
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
          fallback="Are you sure you would like to cancel this invoice?\n\nThis cannot be undone and a new invoice cannot be created for this encounter."
        />
      </ContentText>
      <ModalActionRow
        onConfirm={cancelInvoice}
        onCancel={onClose}
        confirmText={
          <TranslatedText
            stringId="invoice.modal.cancelInvoice.confirmText"
            fallback="Cancel invoice"
          />
        }
        cancelText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
      />
    </Modal>
  );
};

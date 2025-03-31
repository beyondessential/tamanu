import React from 'react';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { ModalActionRow } from '../ModalActionRow';
import { useCancelInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
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
        <TranslatedText
          stringId="invoice.modal.cancelInvoice.title"
          fallback="Cancel invoice"
          data-testid='translatedtext-ch7w' />
      }
      open={open}
      onClose={onClose}
    >
      <ContentText>
        <TranslatedText
          stringId="invoice.modal.cancelInvoice.warningText"
          fallback="Are you sure you would like to cancel this invoice? This cannot be undone."
          data-testid='translatedtext-8xyf' />
      </ContentText>
      <ModalActionRow onConfirm={cancelInvoice} onCancel={onClose} />
    </Modal>
  );
};

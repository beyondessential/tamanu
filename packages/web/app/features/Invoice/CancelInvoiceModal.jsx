import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
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
          data-testid="translatedtext-8q8l"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-9e77"
    >
      <ContentText data-testid="contenttext-u4wh">
        <TranslatedText
          stringId="invoice.modal.cancelInvoice.warningText"
          fallback="Are you sure you would like to cancel this invoice? This cannot be undone."
          data-testid="translatedtext-93cy"
        />
      </ContentText>
      <ModalActionRow
        onConfirm={cancelInvoice}
        onCancel={onClose}
        data-testid="modalactionrow-hbpg"
      />
    </Modal>
  );
};

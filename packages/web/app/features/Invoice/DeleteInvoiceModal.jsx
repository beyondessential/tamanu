import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useDeleteInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 30px auto 60px auto;
  max-width: 440px;
  white-space: pre-wrap;
`;

export const DeleteInvoiceModal = ({ open, onClose, invoice }) => {
  const { mutate } = useDeleteInvoice(invoice);

  const deleteInvoice = async () => {
    mutate(
      {},
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      width="sm"
      title={
        <TranslatedText stringId="invoice.modal.deleteInvoice.title" fallback="Delete invoice" />
      }
      open={open}
      onClose={onClose}
    >
      <ContentText>
        <TranslatedText
          stringId="invoice.modal.deleteInvoice.warningText"
          fallback="Are you sure you would like to delete this invoice?\n\nThis cannot be undone however a new invoice can be created for this encounter if required."
        />
      </ContentText>
      <ModalActionRow
        onConfirm={deleteInvoice}
        onCancel={onClose}
        confirmText={
          <TranslatedText
            stringId="invoice.modal.deleteInvoice.confirmText"
            fallback="Delete invoice"
          />
        }
        cancelText={<TranslatedText stringId="general.action.goBack" fallback="Go back" />}
      />
    </Modal>
  );
};

import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useDeleteInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const DeleteInvoiceModal = ({ open, onClose, invoice, onDeleteSuccess }) => {
  const { mutate } = useDeleteInvoice(invoice);

  const deleteInvoice = async () => {
    mutate(
      {},
      {
        onSuccess: () => {
          if (onDeleteSuccess) onDeleteSuccess();
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      width="sm"
      title={
        <TranslatedText
          stringId="invoice.modal.deleteInvoice.title"
          fallback="Delete invoice"
          data-testid="translatedtext-kiqe"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-x36w"
    >
      <ContentText data-testid="contenttext-sweo">
        <TranslatedText
          stringId="invoice.modal.deleteInvoice.warningText"
          fallback="Are you sure you would like to delete this invoice? This cannot be undone."
          data-testid="translatedtext-t12l"
        />
      </ContentText>
      <ModalActionRow
        onConfirm={deleteInvoice}
        onDelete={onClose}
        data-testid="modalactionrow-7iph"
      />
    </Modal>
  );
};

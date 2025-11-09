import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../components/Modal';
import { TranslatedText } from '../../components/Translation';
import { ModalActionRow } from '../../components/ModalActionRow';
import { useFinaliseInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const FinaliseInvoiceModal = ({ open, onClose, invoice }) => {
  const { mutate } = useFinaliseInvoice(invoice);

  const finaliseInvoice = async () => {
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
          stringId="invoice.modal.finaliseInvoice.title"
          fallback="Finalise invoice"
          data-testid="translatedtext-jphh"
        />
      }
      open={open}
      onClose={onClose}
      data-testid="modal-j1bi"
    >
      <ContentText data-testid="contenttext-ebxz">
        <TranslatedText
          stringId="invoice.modal.finaliseInvoice.warningText"
          fallback="Are you sure you would like to finalise this invoice? You will not be able to make any changes."
          data-testid="translatedtext-80vy"
        />
      </ContentText>
      <ModalActionRow
        onConfirm={finaliseInvoice}
        onCancel={onClose}
        confirmText={
          <TranslatedText
            stringId="general.action.finalise"
            fallback="Finalise"
            data-testid="translatedtext-ah5j"
          />
        }
        data-testid="modalactionrow-r8rf"
      />
    </Modal>
  );
};

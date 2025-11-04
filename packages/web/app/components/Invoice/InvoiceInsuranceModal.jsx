import React from 'react';
import styled from 'styled-components';
import { Modal } from '../Modal';
import { TranslatedText } from '../Translation';
import { ModalActionRow } from '../ModalActionRow';
import { useFinaliseInvoice } from '../../api/mutations/useInvoiceMutation';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const InvoiceInsuranceModal = ({ open, onClose, invoice }) => {
  const { mutate } = useFinaliseInvoice(invoice);

  const onConfirm = async () => {
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
        <TranslatedText stringId="invoice.modal.insurancePlans.title" fallback="Insurance plans" />
      }
      open={open}
      onClose={onClose}
    >
      <ContentText>
        <TranslatedText
          stringId="invoice.modal.insurancePlans.text"
          fallback="Select or remove the insurers you would like to apply to this patient invoice below."
        />
      </ContentText>
      <ModalActionRow onConfirm={onConfirm} onCancel={onClose} />
    </Modal>
  );
};

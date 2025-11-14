import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../../components/Modal';
import { TranslatedText } from '../../../components/Translation';
import { ModalActionRow } from '../../../components/ModalActionRow';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const ConfirmPaidModal = ({ open, onClose, onConfirm }) => {
  return (
    <Modal width="sm" open={open} onClose={onClose} data-testid="modal-092j">
      <ContentText data-testid="contenttext-rh3t">
        <TranslatedText
          stringId="invoice.modal.confirmPaid.warningText"
          fallback="This payment will set this invoice as 'Paid' and no changes will be possible after this. Are you sure you wish to record this payment?"
          data-testid="translatedtext-czn7"
        />
      </ContentText>
      <ModalActionRow onConfirm={onConfirm} onCancel={onClose} data-testid="modalactionrow-q1r8" />
    </Modal>
  );
};

import React from 'react';
import styled from 'styled-components';
import { Modal } from '../../Modal';
import { TranslatedText } from '../../Translation';
import { ModalActionRow } from '../../ModalActionRow';

const ContentText = styled.div`
  margin: 20px 18px 50px 18px;
`;

export const ConfirmPaidModal = ({ open, onClose, onConfirm }) => {
  return (
    <Modal
      width="sm"
      open={open}
      onClose={onClose}
    >
      <ContentText>
        <TranslatedText
          stringId="invoice.modal.confirmPaid.warningText"
          fallback="This payment will set this invoice as 'Paid' and no changes will be possible after this. Are you sure you wish to record this payment?"
          data-testid='translatedtext-8uph' />
      </ContentText>
      <ModalActionRow onConfirm={onConfirm} onCancel={onClose} />
    </Modal>
  );
};

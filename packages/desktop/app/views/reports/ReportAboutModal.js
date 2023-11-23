import React from 'react';
import { ButtonRow, Modal, OutlinedButton } from '../../components';

export const ReportAboutModal = ({
  title,
  open,
  onClose,
  content,
  ConfirmButton = OutlinedButton,
}) => (
  <Modal title={title} open={open} onClose={onClose} cornerExitButton={false}>
    <p>{content}</p>
    <ButtonRow>
      <ConfirmButton variant="contained" onClick={onClose}>
        Close
      </ConfirmButton>
    </ButtonRow>
  </Modal>
);

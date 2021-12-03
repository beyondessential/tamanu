import React from 'react';

import { DeleteButton, Button } from './Button';
import { ButtonRow } from './ButtonRow';
import { Modal } from './Modal';

export const WarningModal = React.memo(({ open, title, text, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <h3>WARNING: This action is irreversible!</h3>
    <p>{text}</p>
    <ButtonRow>
      <DeleteButton onClick={onConfirm}>Yes</DeleteButton>
      <Button variant="contained" color="primary" onClick={onClose}>
        No
      </Button>
    </ButtonRow>
  </Modal>
));

import React from 'react';
import { Modal } from './Modal';
import { ButtonRow } from './ButtonRow';
import { Button } from './Button';

export const AlertModal = React.memo(({ open, onClose, title, subtitle, text }) => (
  <Modal title={title} open={open} onClose={onClose}>
    <p>
      <strong>{subtitle}</strong>
    </p>
    <p>{text}</p>
    <ButtonRow>
      <Button variant="contained" color="primary" onClick={onClose}>
        OK
      </Button>
    </ButtonRow>
  </Modal>
));

import React from 'react';
import styled from 'styled-components';

import { DeleteButton, Button } from './Button';
import { Modal } from './Modal';

const BackButton = styled(Button)`
  margin-left: 8px;
`;

export const WarningModal = React.memo(({ open, title, text, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} title={title}>
    <h3>WARNING: This action is irreversible!</h3>
    <p>{text}</p>
    <DeleteButton onClick={onConfirm} variant="contained">
      Yes
    </DeleteButton>
    <BackButton onClick={onClose} variant="contained" color="primary">
      No
    </BackButton>
  </Modal>
));

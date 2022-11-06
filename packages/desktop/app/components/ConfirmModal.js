import React from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { OutlinedButton, Button } from './Button';
import { ButtonRow } from './ButtonRow';

const Content = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

export const ConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  title,
  text,
  subText,
  width = 'sm',
  ConfirmButton = OutlinedButton,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
}) => (
  <Modal width={width} title={title} open={open} onClose={onCancel}>
    <Content>
      <h3>{text}</h3>
      <p>{subText}</p>
    </Content>
    <ButtonRow>
      <Button variant="contained" onClick={onCancel}>
        {cancelButtonText}
      </Button>
      <ConfirmButton variant="contained" onClick={onConfirm}>
        {confirmButtonText}
      </ConfirmButton>
    </ButtonRow>
  </Modal>
);

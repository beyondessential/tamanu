import React from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { OutlinedButton } from './Button';
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
  customContent,
}) => (
  <Modal width={width} title={title} open={open} onClose={onCancel} cornerExitButton={false}>
    {customContent || (
      <Content>
        <h3>{text}</h3>
        <p>{subText}</p>
      </Content>
    )}
    <ButtonRow>
      <OutlinedButton onClick={onCancel}>{cancelButtonText}</OutlinedButton>
      <ConfirmButton variant="contained" onClick={onConfirm}>
        {confirmButtonText}
      </ConfirmButton>
    </ButtonRow>
  </Modal>
);

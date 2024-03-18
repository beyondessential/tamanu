import React from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { OutlinedButton } from './Button';
import { ButtonRow } from './ButtonRow';
import { TranslatedText } from './Translation/TranslatedText';

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
  confirmButtonText = <TranslatedText stringId="general.action.confirm" fallback="Confirm" />,
  cancelButtonText = <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
  customContent,
}) => (
  <Modal width={width} title={title} open={open} onClose={onCancel}>
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

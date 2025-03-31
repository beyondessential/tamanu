import React from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { OutlinedButton } from './Button';
import { ButtonRow } from './ButtonRow';
import { TranslatedText } from './Translation/TranslatedText';
import { ConfirmRowDivider } from './ConfirmRowDivider';

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
  confirmButtonText = <TranslatedText
    stringId="general.action.confirm"
    fallback="Confirm"
    data-test-id='translatedtext-a4do' />,
  cancelButtonText = <TranslatedText
    stringId="general.action.cancel"
    fallback="Cancel"
    data-test-id='translatedtext-viv2' />,
  className,
  customContent,
}) => (
  <Modal className={className} width={width} title={title} open={open} onClose={onCancel}>
    {customContent || (
      <Content>
        <h3 data-test-id='h3-nwiq'>{text}</h3>
        <p data-test-id='p-v8hh'>{subText}</p>
      </Content>
    )}
    <ConfirmRowDivider />
    <ButtonRow data-test-id='buttonrow-bstt'>
      <OutlinedButton onClick={onCancel} data-test-id='outlinedbutton-eyga'>{cancelButtonText}</OutlinedButton>
      <ConfirmButton variant="contained" onClick={onConfirm}>
        {confirmButtonText}
      </ConfirmButton>
    </ButtonRow>
  </Modal>
);

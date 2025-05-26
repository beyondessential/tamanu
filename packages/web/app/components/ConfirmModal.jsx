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
  confirmButtonText = (
    <TranslatedText
      stringId="general.action.confirm"
      fallback="Confirm"
      data-testid="translatedtext-40y7"
    />
  ),
  cancelButtonText = (
    <TranslatedText
      stringId="general.action.cancel"
      fallback="Cancel"
      data-testid="translatedtext-ki9e"
    />
  ),
  className,
  customContent,
}) => (
  <Modal
    className={className}
    width={width}
    title={title}
    open={open}
    onClose={onCancel}
    data-testid="modal-dgog"
  >
    {customContent || (
      <Content data-testid="content-cpjk">
        <h3>{text}</h3>
        <p>{subText}</p>
      </Content>
    )}
    <ConfirmRowDivider data-testid="confirmrowdivider-f8hm" />
    <ButtonRow data-testid="buttonrow-5x0v">
      <OutlinedButton onClick={onCancel} data-testid="outlinedbutton-p957">
        {cancelButtonText}
      </OutlinedButton>
      <ConfirmButton variant="contained" onClick={onConfirm} data-testid="confirmbutton-y3tb">
        {confirmButtonText}
      </ConfirmButton>
    </ButtonRow>
  </Modal>
);

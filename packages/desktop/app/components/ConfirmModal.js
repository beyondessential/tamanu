import React from 'react';
import styled from 'styled-components';
import { Divider as BaseDivider } from '@material-ui/core';

import { MODAL_PADDING_LEFT_AND_RIGHT, Modal } from './Modal';
import { OutlinedButton } from './Button';
import { ButtonRow } from './ButtonRow';

const Content = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const FlexSpaceBetween = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Divider = styled(BaseDivider)`
  margin: 30px -${MODAL_PADDING_LEFT_AND_RIGHT}px;
`;

const GoBackButtonContainer = styled(ButtonRow)`
  align-items: stretch;
  justify-content: flex-start;

  > button,
  > div {
    margin-left: 0px;
  }
`;

export const ConfirmModal = ({
  open,
  onCancel,
  onBack,
  onConfirm,
  title,
  text,
  subText,
  width = 'sm',
  ConfirmButton = OutlinedButton,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  backButtonText = 'Back',
  customContent,
}) => (
  <Modal width={width} title={title} open={open} onClose={onCancel} cornerExitButton={false}>
    {customContent || (
      <Content>
        <h3>{text}</h3>
        <p>{subText}</p>
      </Content>
    )}
    <Divider />
    <FlexSpaceBetween>
      {onBack && (
        <GoBackButtonContainer>
          <OutlinedButton onClick={onBack}>{backButtonText}</OutlinedButton>
        </GoBackButtonContainer>
      )}
      <ButtonRow>
        <OutlinedButton onClick={onCancel}>{cancelButtonText}</OutlinedButton>
        <ConfirmButton variant="contained" onClick={onConfirm}>
          {confirmButtonText}
        </ConfirmButton>
      </ButtonRow>
    </FlexSpaceBetween>
  </Modal>
);

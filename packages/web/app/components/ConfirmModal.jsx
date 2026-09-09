import React from 'react';
import styled from 'styled-components';

import { Button, ButtonRow, OutlinedButton, Modal, TranslatedText } from '@tamanu/ui-components';
import { ConfirmRowDivider } from './ConfirmRowDivider';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

const Content = styled.div`
  text-align: center;
  margin-block-end: 2rem;
`;

export const ConfirmModal = ({
  open,
  onCancel,
  onConfirm,
  title,
  text,
  subText,
  width = 'sm',
  ConfirmButton = Button,
  confirmButtonText = <TranslatedText stringId="general.action.confirm" fallback="Confirm" />,
  cancelButtonText = <TranslatedText stringId="general.action.cancel" fallback="Cancel" />,
  className,
  customContent,
  noteBlockConfirmButton = false,
  confirmButtonProps,
}) => {
  const ConfirmButtonWrapper = noteBlockConfirmButton ? NoteModalActionBlocker : React.Fragment;
  return (
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
        <ConfirmButtonWrapper>
          <ConfirmButton
            {...confirmButtonProps}
            onClick={onConfirm}
            data-testid="confirmbutton-y3tb"
          >
            {confirmButtonText}
          </ConfirmButton>
        </ConfirmButtonWrapper>
      </ButtonRow>
    </Modal>
  );
};

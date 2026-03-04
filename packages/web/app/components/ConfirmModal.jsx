import React from 'react';
import styled from 'styled-components';

import { ButtonRow, OutlinedButton, Modal, TranslatedText } from '@tamanu/ui-components';
import { ConfirmRowDivider } from './ConfirmRowDivider';
import { NoteModalActionBlocker } from './NoteModalActionBlocker';

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
  noteBlockConfirmButton = false,
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
      {noteBlockConfirmButton ? (
        <NoteModalActionBlocker>
          <ConfirmButton variant="contained" onClick={onConfirm} data-testid="confirmbutton-y3tb">
            {confirmButtonText}
          </ConfirmButton>
        </NoteModalActionBlocker>
      ) : (
        <ConfirmButton variant="contained" onClick={onConfirm} data-testid="confirmbutton-y3tb">
          {confirmButtonText}
        </ConfirmButton>
      )}
    </ButtonRow>
  </Modal>
);

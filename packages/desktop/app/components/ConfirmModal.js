import React from 'react';
import styled from 'styled-components';

import { Modal } from './Modal';
import { OutlinedButton, DeleteButton, Button } from './Button';
import { ButtonRow } from './ButtonRow';

const ContentPane = styled.div`
  text-align: center;
`;

export const ConfirmModal = ({
  title,
  text,
  subText,
  confirmButtonText = 'Confirm',
  isDelete = false,
  open,
  onClose,
  onConfirm,
}) => {
  const ConfirmButton = isDelete ? DeleteButton : OutlinedButton;
  return (
    <Modal width="md" title={title} open={open} onClose={onClose}>
      <ContentPane>
        <h3>{text}</h3>
        {subText ? <p>{subText}</p> : null}
        <ButtonRow>
          <Button variant="contained" onClick={onClose}>
            Cancel
          </Button>
          <ConfirmButton variant="contained" onClick={onConfirm}>
            {confirmButtonText}
          </ConfirmButton>
        </ButtonRow>
      </ContentPane>
    </Modal>
  );
};

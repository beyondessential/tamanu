import React from 'react';
import styled from 'styled-components';
import { Modal, ModalGenericButtonRow, OutlinedButton } from '../../components';

const Spacer = styled.div`
  padding-top: 15px;
`;
export const ReportAboutModal = ({
  title,
  open,
  onClose,
  content,
  ConfirmButton = OutlinedButton,
}) => (
  <Modal title={title} open={open} onClose={onClose} cornerExitButton={false}>
    <p>{content}</p>
    <Spacer />
    <ModalGenericButtonRow>
      <ConfirmButton variant="contained" onClick={onClose}>
        Close
      </ConfirmButton>
    </ModalGenericButtonRow>
  </Modal>
);

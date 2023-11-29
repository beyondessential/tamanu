import React from 'react';
import styled from 'styled-components';
import { Typography } from '@material-ui/core';
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
    {content.split('\n').map(line => (
      <Typography>{line}</Typography>
    ))}
    <Spacer />
    <ModalGenericButtonRow>
      <ConfirmButton variant="contained" onClick={onClose}>
        Close
      </ConfirmButton>
    </ModalGenericButtonRow>
  </Modal>
);

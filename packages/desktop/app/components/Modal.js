import React, { memo } from 'react';
import styled from 'styled-components';
import { Dialog as MuiDialog, DialogTitle, DialogActions } from '@material-ui/core';

const ModalContent = styled.div`
  flex: 1 1 auto;
  padding: 18px 32px;
`;

const ModalContainer = styled.div`
  background: #f3f5f7;
`;

const DialogTitleComponent = styled(DialogTitle)`
  padding: 14px 14px 14px 32px !important;
`;

export const Modal = memo(({ title, children, actions, ...props }) => {
  return (
    <MuiDialog fullWidth maxWidth="sm" {...props}>
      <DialogTitleComponent>{title}</DialogTitleComponent>
      <ModalContainer>
        <ModalContent>{children}</ModalContent>
        <DialogActions>{actions}</DialogActions>
      </ModalContainer>
    </MuiDialog>
  );
});

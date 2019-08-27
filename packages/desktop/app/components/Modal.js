import React, { memo } from 'react';
import styled from 'styled-components';
import { Dialog as MuiDialog, DialogTitle, DialogActions } from '@material-ui/core';

const ModalContent = styled.div`
  flex: 1 1 auto;
  padding: 0 24px 24px;
`;

export const Modal = memo(({ title, children, actions, width="sm", ...props }) => {
  return (
    <MuiDialog fullWidth maxWidth={width} {...props}>
      <DialogTitle>{title}</DialogTitle>
      <ModalContent>{children}</ModalContent>
      <DialogActions>{actions}</DialogActions>
    </MuiDialog>
  );
});

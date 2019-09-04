import React, { memo } from 'react';
import styled from 'styled-components';
import { Dialog as MuiDialog, DialogTitle, DialogActions, withStyles } from '@material-ui/core';

const ModalContent = styled.div`
  flex: 1 1 auto;
  padding: 18px 32px;
`;

const ModalContainer = styled.div`
  background: #f3f5f7;
`;

const styles = () => ({
  title: {
    padding: '14px 14px 14px 32px',
  },
});

export const Modal = memo(
  withStyles(styles)(({ title, children, actions, width = 'sm', ...props }) => {
    return (
      <MuiDialog fullWidth maxWidth={width} {...props}>
        <DialogTitle className={props.classes.title}>{title}</DialogTitle>
        <ModalContainer>
          <ModalContent>{children}</ModalContent>
          <DialogActions>{actions}</DialogActions>
        </ModalContainer>
      </MuiDialog>
    );
  }),
);

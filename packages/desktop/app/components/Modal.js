import React, { memo } from 'react';
import styled from 'styled-components';
import MuiDialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import { withStyles } from '@material-ui/core/styles';

const MODAL_PADDING = 32;

const ModalContent = styled.div`
  flex: 1 1 auto;
  padding: 18px ${MODAL_PADDING}px;
`;

const ModalContainer = styled.div`
  background: #f3f5f7;
`;

export const FullWidthRow = styled.div`
  margin: 0 -${MODAL_PADDING}px;
  grid-column: 1 / -1;
`;

const styles = () => ({
  title: {
    padding: '14px 14px 14px 32px',
  },
});

export const Modal = memo(
  withStyles(styles)(({ title, children, actions, width = 'sm', classes, ...props }) => {
    const { title: titleClass, ...otherClasses } = classes;
    return (
      <MuiDialog fullWidth maxWidth={width} classes={otherClasses} {...props}>
        <DialogTitle className={titleClass}>{title}</DialogTitle>
        <ModalContainer>
          <ModalContent>{children}</ModalContent>
          <DialogActions>{actions}</DialogActions>
        </ModalContainer>
      </MuiDialog>
    );
  }),
);

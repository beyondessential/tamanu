import React, { memo } from 'react';
import { Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';

export const ModalActions = memo(({ children, ...props }) => (
  <DialogActions {...props}>{children}</DialogActions>
));

export const ModalContent = memo(({ children, ...props }) => (
  <DialogContent {...props}>{children}</DialogContent>
));

export const Modal = memo(({ title, children, open, onClose, ...props }) => {
  return (
    <MuiDialog fullWidth maxWidth="sm" {...props} open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      {children}
    </MuiDialog>
  );
});

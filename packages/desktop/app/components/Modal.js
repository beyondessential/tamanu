import React, { memo } from 'react';
import { Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions } from '@material-ui/core';

export const Modal = memo(({ title, children, open, onClose, actions, ...props }) => {
  return (
    <MuiDialog fullWidth maxWidth="sm" {...props} open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>{actions}</DialogActions>
    </MuiDialog>
  );
});

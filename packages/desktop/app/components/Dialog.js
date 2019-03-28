import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog as MuiDialog, DialogTitle, DialogContent, DialogActions,
} from '@material-ui/core';
import { Button } from './Button';

export function Dialog({
  dialogType, headerTitle, contentText, isVisible,
  onClose, onConfirm, okText, cancelText,
}) {
  return (
    <MuiDialog open={isVisible} onClose={onClose}>
      <DialogTitle>{headerTitle}</DialogTitle>
      <DialogContent>{contentText}</DialogContent>
      <DialogActions>
        {dialogType === 'confirm' && <Button variant="outlined" onClick={onClose}>{cancelText}</Button>}
        <Button
          variant="contained"
          color="primary"
          onClick={dialogType === 'confirm' ? onConfirm : onClose}
        >
          {okText}
        </Button>
      </DialogActions>
    </MuiDialog>
  );
}

Dialog.propTypes = {
  dialogType: PropTypes.oneOf(['alert', 'confirm']),
  headerTitle: PropTypes.string.isRequired,
  contentText: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
};

Dialog.defaultProps = {
  dialogType: 'alert',
  okText: 'OK',
  cancelText: 'Cancel',
  onConfirm: () => {},
};

import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@material-ui/core';

import { Button } from './Button';

function ModalView({
  modalType,
  headerTitle,
  contentText,
  isVisible,
  onClose,
  onConfirm,
  okText,
  cancelText,
}) {
  return (
    <Dialog open={isVisible} onClose={onClose} little>
      <DialogTitle>{headerTitle}</DialogTitle>
      <DialogContent>{contentText}</DialogContent>
      <DialogActions>
        {modalType === 'confirm' && <Button variant="outlined" onClick={onClose}>{cancelText}</Button>}
        <Button
          variant="contained"
          color="primary"
          onClick={modalType === 'confirm' ? onConfirm : onClose}
        >
          {okText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ModalView.propTypes = {
  modalType: PropTypes.oneOf(['alert', 'confirm']),
  headerTitle: PropTypes.string.isRequired,
  contentText: PropTypes.string.isRequired,
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  okText: PropTypes.string,
  cancelText: PropTypes.string,
};

ModalView.defaultProps = {
  modalType: 'alert',
  okText: 'OK',
  cancelText: 'Cancel',
  onConfirm: () => {},
};

export default ModalView;
